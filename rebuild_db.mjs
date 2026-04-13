import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyZHhrcHlpcGZ4amZqbmR4b3N2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDUxOTg1MywiZXhwIjoyMDg2MDk1ODUzfQ.1D7wsd2QPOLaFeOS7bo_aPeHDJJB3P3TDF2LH4L3wc8";
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Apagando dados antigos...');
  await supabase.from('lesson_progress').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('enrollments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('lessons').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('courses').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log('Criando APENAS UM curso principal...');
  const { data: newCourse, error } = await supabase
    .from('courses')
    .insert([{ 
      title: 'Plataforma Principal (Pasta 1)', 
      category: 'Medicina',
      description: 'Todos os módulos do Drive.',
      instructor: 'Administrações',
      thumbnail_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=300' 
    }])
    .select()
    .single();
    
  if(error) { console.error('Erro ao criar curso', error); return; }
  const courseId = newCourse.id;

  const keyPath = path.join(__dirname, 'lms-cursos-streaming-26f801dfa40b.json');
  const auth = new google.auth.GoogleAuth({
    keyFile: keyPath,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  const drive = google.drive({ version: 'v3', auth });

  const res = await drive.files.list({
    pageSize: 1000,
    fields: 'files(id, name, mimeType, parents, videoMediaMetadata)',
    q: "trashed = false",
  });
  const files = res.data.files;
  
  const parentFolderId = '1nHSdRyBjFjMQ1Bzk5_WOArC4TfhH_IN9';
  const modules = files.filter(f => f.parents && f.parents.includes(parentFolderId));
  
  let orderIndex = 1;
  let totalMinutes = 0;

  for (const mod of modules) {
    const moduleName = mod.name; 
    console.log('Módulo:', moduleName);
    
    const subfolders = files.filter(f => f.parents && f.parents.includes(mod.id) && f.mimeType === 'application/vnd.google-apps.folder');
    
    for (const sub of subfolders) {
      const videos = files.filter(f => f.parents && f.parents.includes(sub.id) && f.mimeType.startsWith('video/'));
      
      for (const video of videos) {
        let durationMinutes = 0;
        if (video.videoMediaMetadata && video.videoMediaMetadata.durationMillis) {
          durationMinutes = Math.round(video.videoMediaMetadata.durationMillis / 60000);
          totalMinutes += durationMinutes;
        }

        const title = `[${sub.name}] ${video.name.replace('.discreto.mp4', '')}`;

        await supabase.from('lessons').insert([{
          course_id: courseId,
          title: title,
          description: moduleName, // ESTAMOS USANDO A DESCRIÇÃO COMO CATEGORIA
          video_url: video.id,
          duration_minutes: durationMinutes || 10,
          order_index: orderIndex
        }]);
        
        orderIndex++;
      }
    }
  }

  const hours = Math.round(totalMinutes / 60);
  await supabase.from('courses').update({ duration_hours: hours }).eq('id', courseId);
  
  console.log('Mapeamento concluído com sucesso! Horas totais:', hours);
}
run();
