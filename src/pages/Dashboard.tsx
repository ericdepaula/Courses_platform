import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock3, FolderOpen } from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { LoadingScreen } from "../components/ui/LoadingScreen";
import { ProgressBar } from "../components/ui/ProgressBar";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

interface Course {
  id: string;
  title: string;
  instructor: string;
  thumbnail_url: string;
  category: string;
  duration_hours: number;
}

interface CourseGroup {
  name: string;
  thumbnail_url: string;
  duration_hours: number;
  matters: Course[];
  progress: number;
  totalLessons: number;
  completedLessons: number;
}

type EnrollmentRow = {
  course_id: string;
};

function fallbackGradient(title: string) {
  const palette = [
    "from-[#11203d] to-[#1f3b72]",
    "from-[#16243a] to-[#2a5477]",
    "from-[#1b2943] to-[#365a82]",
  ];
  const index = title.length % palette.length;
  return palette[index];
}

export function Dashboard() {
  const [courseGroups, setCourseGroups] = useState<CourseGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    void loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) {
      setCourseGroups([]);
      setLoading(false);
      return;
    }

    try {
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("course_id")
        .eq("user_id", user.id);

      const enrollmentRows = (enrollments as EnrollmentRow[] | null) || [];
      if (enrollmentRows.length === 0) {
        setCourseGroups([]);
        return;
      }

      const courseIds = [...new Set(enrollmentRows.map((enrollment) => enrollment.course_id).filter(Boolean))];
      if (courseIds.length === 0) {
        setCourseGroups([]);
        return;
      }

      const { data: courseRows, error: coursesError } = await supabase
        .from("courses")
        .select("id, title, instructor, thumbnail_url, category, duration_hours")
        .in("id", courseIds);

      if (coursesError) {
        throw coursesError;
      }

      const categoryCourses = (courseRows || []) as Course[];
      if (categoryCourses.length === 0) {
        setCourseGroups([]);
        return;
      }

      const lessonRows = await Promise.all(
        categoryCourses.map(async (course) => {
          const { data: lessons } = await supabase.from("lessons").select("id").eq("course_id", course.id);
          return {
            courseId: course.id,
            lessonIds: lessons?.map((lesson) => lesson.id) || [],
          };
        }),
      );

      const allLessonIds = lessonRows.flatMap((row) => row.lessonIds);
      const { data: progressRows } = await supabase
        .from("lesson_progress")
        .select("lesson_id, completed")
        .eq("user_id", user.id)
        .in("lesson_id", allLessonIds.length > 0 ? allLessonIds : [""]);

      const completedByLesson = new Map(
        (progressRows || []).map((row) => [row.lesson_id, Boolean(row.completed)]),
      );
      const lessonIdsByCourse = new Map(lessonRows.map((row) => [row.courseId, row.lessonIds]));

      const groups = categoryCourses.reduce<Record<string, CourseGroup>>((acc, course) => {
        const groupName = course.category || "Curso";
        const lessonIds = lessonIdsByCourse.get(course.id) || [];
        const completedLessons = lessonIds.filter((lessonId) => completedByLesson.get(lessonId)).length;

        if (!acc[groupName]) {
          acc[groupName] = {
            name: groupName,
            thumbnail_url: course.thumbnail_url,
            duration_hours: 0,
            matters: [],
            progress: 0,
            totalLessons: 0,
            completedLessons: 0,
          };
        }

        acc[groupName].matters.push(course);
        acc[groupName].duration_hours += course.duration_hours || 0;
        acc[groupName].totalLessons += lessonIds.length;
        acc[groupName].completedLessons += completedLessons;
        if (!acc[groupName].thumbnail_url && course.thumbnail_url) {
          acc[groupName].thumbnail_url = course.thumbnail_url;
        }

        return acc;
      }, {});

      const groupedCards = Object.values(groups)
        .map((group) => ({
          ...group,
          progress:
            group.totalLessons > 0
              ? Math.round((group.completedLessons / group.totalLessons) * 100)
              : 0,
          matters: group.matters.sort((left, right) => left.title.localeCompare(right.title)),
        }))
        .sort((left, right) => left.name.localeCompare(right.name));

      setCourseGroups(groupedCards);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => {
    const totalCourses = courseGroups.length;
    const averageProgress =
      totalCourses > 0
        ? Math.round(courseGroups.reduce((acc, course) => acc + course.progress, 0) / totalCourses)
        : 0;
    const completedLessons = courseGroups.reduce((acc, course) => acc + course.completedLessons, 0);

    return { totalCourses, averageProgress, completedLessons };
  }, [courseGroups]);

  if (loading) {
    return (
      <Layout title="Painel">
        <LoadingScreen
          label="Montando seu painel"
        />
      </Layout>
    );
  }

  return (
    <Layout title="Painel">
      <div className="space-y-6">
        <Card className="p-6">
          <div className="space-y-5">
            <div>
              <p className="section-kicker mb-2">Resumo</p>
              <h2 className="headline-display text-4xl text-[var(--text-strong)]">Seus cursos</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="surface-subtle rounded-[1rem] p-4">
                <p className="text-sm text-[var(--text-muted)]">Cursos liberados</p>
                <p className="mt-2 text-3xl font-bold text-[var(--text-strong)]">{summary.totalCourses}</p>
              </div>
              <div className="surface-subtle rounded-[1rem] p-4">
                <p className="text-sm text-[var(--text-muted)]">Progresso médio</p>
                <p className="mt-2 text-3xl font-bold text-[var(--text-strong)]">{summary.averageProgress}%</p>
              </div>
              <div className="surface-subtle rounded-[1rem] p-4">
                <p className="text-sm text-[var(--text-muted)]">Aulas concluídas</p>
                <p className="mt-2 text-3xl font-bold text-[var(--text-strong)]">{summary.completedLessons}</p>
              </div>
            </div>
          </div>
        </Card>

        <section className="space-y-4">
          <div>
            <p className="section-kicker mb-2">Acesso liberado</p>
            <h3 className="headline-display text-3xl text-[var(--text-strong)]">Escolha um curso</h3>
          </div>

          {courseGroups.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="mx-auto max-w-xl">
                <h4 className="headline-display text-3xl text-[var(--text-strong)]">Nenhum curso disponível.</h4>
                <p className="mt-3 text-[var(--text-muted)]">
                  Quando um administrador liberar seu acesso, o curso vai aparecer aqui.
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4">
              {courseGroups.map((group) => (
                <Card
                  key={group.name}
                  className="overflow-hidden p-4"
                  hover
                  onClick={() => navigate(`/course-group/${encodeURIComponent(group.name)}`)}
                >
                  <div className="grid gap-5 md:grid-cols-[180px_1fr]">
                    {group.thumbnail_url ? (
                      <img
                        src={group.thumbnail_url}
                        alt={group.name}
                        className="h-full min-h-[150px] w-full rounded-[1rem] object-cover"
                      />
                    ) : (
                      <div
                        className={`flex min-h-[150px] items-end rounded-[1rem] bg-gradient-to-br p-5 ${fallbackGradient(
                          group.name,
                        )}`}
                      >
                        <p className="headline-display text-3xl text-white">{group.name}</p>
                      </div>
                    )}
                    <div className="flex flex-col justify-between gap-4">
                      <div>
                        <div className="mb-3 flex flex-wrap gap-2 text-xs font-semibold">
                          <span className="rounded-full bg-[var(--bg-soft)] px-3 py-1 text-[var(--brand-blue)]">
                            {group.matters.length} matérias liberadas
                          </span>
                        </div>
                        <h4 className="text-2xl font-bold text-[var(--text-strong)]">{group.name}</h4>
                        <p className="mt-2 text-sm text-[var(--text-muted)]">
                          {group.completedLessons} de {group.totalLessons} aulas concluídas
                        </p>
                      </div>
                      <ProgressBar progress={group.progress} />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                          <Clock3 className="h-4 w-4 text-[var(--brand-teal)]" />
                          {group.duration_hours || 0}h estimadas
                        </div>
                        <Button
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            navigate(`/course-group/${encodeURIComponent(group.name)}`);
                          }}
                        >
                          <FolderOpen className="h-4 w-4" />
                          Abrir curso
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
