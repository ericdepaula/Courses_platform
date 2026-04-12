import { google } from 'googleapis';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const DRIVE_CATEGORY = 'Medicina - Residência';

function slugify(value) {
  return normalizeTitle(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function loadVideosMetadata(drive, files) {
  const jsonFile = files.find((file) => file.name === 'videos.json');
  if (!jsonFile) {
    return { byPath: new Map(), categoryNames: new Map() };
  }

  const response = await drive.files.get(
    { fileId: jsonFile.id, alt: 'media' },
    { responseType: 'text' },
  );

  const raw = typeof response.data === 'string' ? response.data : String(response.data);
  const parsed = JSON.parse(raw);
  const videos = Array.isArray(parsed?.videos) ? parsed.videos : [];

  const byPath = new Map();
  const categoryNames = new Map();

  for (const item of videos) {
    if (item?.path) {
      byPath.set(normalizeTitle(item.path), item);
    }
    if (item?.category) {
      categoryNames.set(slugify(item.category), item.category);
    }
  }

  return { byPath, categoryNames };
}

function normalizeTitle(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

async function syncDrive() {
  console.log('Iniciando sincronização...');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Defina VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente antes de sincronizar.');
  }
  
  const keyPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    process.env.DRIVE_SERVICE_ACCOUNT_KEY_FILE ||
    path.join(__dirname, 'lms-cursos-streaming-26f801dfa40b.json');
  const auth = new google.auth.GoogleAuth({
    keyFile: keyPath,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });

  const drive = google.drive({ version: 'v3', auth });

  try {
    const res = await drive.files.list({
      pageSize: 1000,
      fields: 'files(id, name, mimeType, parents, videoMediaMetadata)',
      q: "trashed = false",
    });

    const files = res.data.files ?? [];
    
    // Pasta raiz atual que contém os cursos no Google Drive.
    const parentFolderId = '1o2c87xXkNeKhsk3zxbvgo4i3gPxOldh9';
    const courseFolders = files.filter(
      (file) =>
        file.parents &&
        file.parents.includes(parentFolderId) &&
        file.mimeType === 'application/vnd.google-apps.folder',
    );

    const { data: existingCourses, error: existingCoursesError } = await supabase
      .from('courses')
      .select('*');

    if (existingCoursesError) {
      throw existingCoursesError;
    }

    const metadata = await loadVideosMetadata(drive, files);
    
    console.log(`Encontrados ${courseFolders.length} cursos potenciais.`);
    const activeCourseIds = new Set();

    for (const courseFolder of courseFolders) {
      // Cria ou busca o curso no Supabase
      console.log(`Processando curso: ${courseFolder.name}`);
      let courseId;
      const normalizedFolderTitle = normalizeTitle(courseFolder.name);
      const canonicalCourseTitle =
        metadata.categoryNames.get(slugify(courseFolder.name)) || courseFolder.name;
      
      const matchingCourses = (existingCourses ?? [])
        .filter((course) => normalizeTitle(course.title) === normalizedFolderTitle)
        .sort((left, right) => {
          const leftCreatedAt = left.created_at ? new Date(left.created_at).getTime() : 0;
          const rightCreatedAt = right.created_at ? new Date(right.created_at).getTime() : 0;
          return leftCreatedAt - rightCreatedAt;
        });
      const existingCourse = matchingCourses[0];
        
      if (existingCourse) {
        courseId = existingCourse.id;
        await supabase
          .from('courses')
          .update({ category: DRIVE_CATEGORY, title: canonicalCourseTitle })
          .eq('id', courseId);
        console.log(` Curso já existe: ${courseId}`);
      } else {
        const { data: newCourse, error } = await supabase
          .from('courses')
          .insert([{ 
            title: canonicalCourseTitle, description: 'Curso de ' + canonicalCourseTitle, instructor: 'Sistema', 
            category: DRIVE_CATEGORY, 
            thumbnail_url: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&q=80&w=300' 
          }])
          .select()
          .single();
          
        if (error) throw error;
        courseId = newCourse.id;
        existingCourses?.push(newCourse);
        console.log(` Curso criado: ${courseId}`);
      }
      activeCourseIds.add(courseId);
      // Buscar sub-pastas ("Teóricas", "Exercícios")
      const subfolders = files.filter(
        (file) =>
          file.parents &&
          file.parents.includes(courseFolder.id) &&
          file.mimeType === 'application/vnd.google-apps.folder',
      );
      
      let orderIndex = 1;
      const currentVideoIds = [];

      for (const subfolder of subfolders) {
        // Buscar vídeos dentro de Teóricas/Exercícios
        const videos = files.filter(
          (file) =>
            file.parents &&
            file.parents.includes(subfolder.id) &&
            file.mimeType?.startsWith('video/'),
        );
        
        for (const video of videos) {
          currentVideoIds.push(video.id);
          const metadataKey = normalizeTitle(`${courseFolder.name}/${subfolder.name}/${video.name}`);
          const lessonMetadata = metadata.byPath.get(metadataKey);
          const lessonType = lessonMetadata?.type || subfolder.name;
          const lessonName = lessonMetadata?.name || video.name.replace('.discreto.mp4', '');
          const orderSeed = Number(lessonMetadata?.order) || orderIndex;
          const typeOffset = normalizeTitle(lessonType).startsWith('teor') ? 1 : 2;

          const lessonPayload = {
            course_id: courseId,
            title: `[${lessonType}] ${lessonName}`,
            description: `Aula da categoria ${lessonType}`,
            video_url: video.id,
            duration_minutes: 10,
            order_index: orderSeed * 10 + typeOffset,
          };

          if (video.videoMediaMetadata && video.videoMediaMetadata.durationMillis) {
            lessonPayload.duration_minutes =
              Math.round(video.videoMediaMetadata.durationMillis / 60000) || 10;
          }

          // Atualizar aula se ela já existir para manter ordem, título e duração sincronizados.
          const { data: existingLesson } = await supabase
            .from('lessons')
            .select('*')
            .eq('course_id', courseId)
            .eq('video_url', video.id)
            .maybeSingle();

          if (existingLesson) {
            const { error: lessonError } = await supabase
              .from('lessons')
              .update(lessonPayload)
              .eq('id', existingLesson.id);

            if (lessonError) {
              console.error(`  - Erro ao atualizar aula ${lessonPayload.title}:`, lessonError);
            } else {
              console.log(`  ~ Aula atualizada: ${lessonPayload.title} - ${video.id}`);
            }
          } else {
            const { error: lessonError } = await supabase
              .from('lessons')
              .insert([lessonPayload]);

            if (lessonError) {
              console.error(`  - Erro ao inserir aula ${lessonPayload.title}:`, lessonError);
            } else {
              console.log(`  + Aula inserida: ${lessonPayload.title} - ${video.id}`);
            }
          }

          orderIndex++;
        }
      }

      const { data: existingLessons, error: existingLessonsError } = await supabase
        .from('lessons')
        .select('id, title, video_url')
        .eq('course_id', courseId);

      if (existingLessonsError) {
        throw existingLessonsError;
      }

      const staleLessons = (existingLessons ?? []).filter(
        (lesson) => lesson.video_url && !currentVideoIds.includes(lesson.video_url),
      );

      if (staleLessons.length > 0) {
        const staleLessonIds = staleLessons.map((lesson) => lesson.id);
        const staleVideoIds = staleLessons.map((lesson) => lesson.video_url).filter(Boolean);

        await supabase.from('lesson_progress').delete().in('lesson_id', staleLessonIds);

        const { error: deleteLessonsError } = await supabase
          .from('lessons')
          .delete()
          .in('id', staleLessonIds);

        if (deleteLessonsError) {
          console.error(`  - Erro ao remover aulas antigas do curso ${courseFolder.name}:`, deleteLessonsError);
        } else {
          console.log(
            `  - Removidas ${staleLessons.length} aula(s) órfã(s) do curso ${courseFolder.name}: ${staleVideoIds.join(', ')}`,
          );
        }
      }
    }

    const staleCourses = (existingCourses ?? []).filter(
      (course) => course.category === DRIVE_CATEGORY && !activeCourseIds.has(course.id),
    );

    for (const staleCourse of staleCourses) {
      const { data: staleLessons, error: staleLessonsError } = await supabase
        .from('lessons')
        .select('id')
        .eq('course_id', staleCourse.id);

      if (staleLessonsError) {
        throw staleLessonsError;
      }

      const staleLessonIds = (staleLessons ?? []).map((lesson) => lesson.id);
      if (staleLessonIds.length > 0) {
        await supabase.from('lesson_progress').delete().in('lesson_id', staleLessonIds);
      }

      await supabase.from('lessons').delete().eq('course_id', staleCourse.id);
      await supabase.from('enrollments').delete().eq('course_id', staleCourse.id);
      await supabase.from('courses').delete().eq('id', staleCourse.id);
      console.log(`  - Curso órfão removido: ${staleCourse.title}`);
    }

    console.log('\nSincronização concluída com sucesso!');
  } catch (err) {
    console.error('Erro na sincronização:', err);
  }
}

syncDrive();
