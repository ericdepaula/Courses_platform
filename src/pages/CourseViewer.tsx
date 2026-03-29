import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, Circle, FileText, Download } from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

interface Lesson {
  id: string;
  title: string;
  description: string;
  video_url: string;
  duration_minutes: number;
  order_index: number;
  materials_url: string;
  completed: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
}

export function CourseViewer() {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [activeTab, setActiveTab] = useState<"description" | "materials">(
    "description",
  );
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (courseId) {
      loadCourseData();
    }
  }, [courseId, user]);

  const loadCourseData = async () => {
    if (!courseId) return;

    try {
      const { data: courseData } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .single();

      if (courseData) {
        setCourse(courseData);
      }

      const { data: lessonsData } = await supabase
        .from("lessons")
        .select("*")
        .eq("course_id", courseId)
        .order("order_index", { ascending: true });

      if (lessonsData && user) {
        const { data: progressData } = await supabase
          .from("lesson_progress")
          .select("*")
          .eq("user_id", user.id)
          .in(
            "lesson_id",
            lessonsData.map((l) => l.id),
          );

        const lessonsWithProgress = lessonsData.map((lesson) => ({
          ...lesson,
          completed:
            progressData?.find((p) => p.lesson_id === lesson.id)?.completed ||
            false,
        }));

        setLessons(lessonsWithProgress);
        if (lessonsWithProgress.length > 0) {
          setCurrentLesson(lessonsWithProgress[0]);
        }
      }
    } catch (error) {
      console.error("Error loading course data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLessonComplete = async (lessonId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.from("lesson_progress").upsert(
        {
          user_id: user.id,
          lesson_id: lessonId,
          completed: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,lesson_id",
        },
      );

      if (!error) {
        setLessons((prev) =>
          prev.map((lesson) =>
            lesson.id === lessonId ? { ...lesson, completed: true } : lesson,
          ),
        );
      }
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  };

  const selectLesson = (lesson: Lesson) => {
    setCurrentLesson(lesson);
  };

  if (loading) {
    return (
      <Layout title="Carregando...">
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600">Carregando curso...</div>
        </div>
      </Layout>
    );
  }

  if (!course || !currentLesson) {
    return (
      <Layout title="Curso não encontrado">
        <Card className="p-8 text-center">
          <p className="text-slate-600">Curso não encontrado</p>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout title={course.title}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="overflow-hidden">
            <div className="bg-slate-900 aspect-video flex items-center justify-center relative overflow-hidden rounded-t-xl">
              {currentLesson.video_url ? (
                <iframe
                  src={`https://drive.google.com/file/d/${currentLesson.video_url}/preview`}
                  className="absolute top-0 left-0 w-full h-full border-0"
                  allow="autoplay; encrypted-media; fullscreen"
                  allowFullScreen
                  title={`Vídeo da aula: ${currentLesson.title}`}
                ></iframe>
              ) : (
                <div className="text-center text-white p-8">
                  <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-10 h-10 text-slate-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium text-slate-400">
                    Vídeo indisponível
                  </p>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">
                {currentLesson.title}
              </h2>
              <Button
                variant="primary"
                onClick={() => handleLessonComplete(currentLesson.id)}
                disabled={currentLesson.completed}
              >
                {currentLesson.completed
                  ? "Concluída"
                  : "Marcar como Concluída"}
              </Button>
            </div>

            <div className="border-b border-slate-200 mb-4">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab("description")}
                  className={`pb-3 px-2 font-medium transition-colors ${
                    activeTab === "description"
                      ? "text-indigo-600 border-b-2 border-indigo-600"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <FileText className="w-4 h-4 inline mr-2" />
                  Descrição
                </button>
                <button
                  onClick={() => setActiveTab("materials")}
                  className={`pb-3 px-2 font-medium transition-colors ${
                    activeTab === "materials"
                      ? "text-indigo-600 border-b-2 border-indigo-600"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Download className="w-4 h-4 inline mr-2" />
                  Materiais
                </button>
              </div>
            </div>

            {activeTab === "description" ? (
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-700">{currentLesson.description}</p>
                <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Sobre o Curso
                  </h3>
                  <p className="text-slate-700">{course.description}</p>
                  <p className="text-sm text-slate-600 mt-2">
                    Instrutor: {course.instructor}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-slate-700 mb-4">
                  Materiais complementares para esta aula:
                </p>
                <Card className="p-4 flex items-center justify-between" hover>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        Material da Aula
                      </p>
                      <p className="text-sm text-slate-600">PDF - 2.5 MB</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                </Card>
              </div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="p-4">
            <h3 className="font-bold text-lg text-slate-900 mb-4">
              Conteúdo do Curso
            </h3>
            <div className="space-y-2">
              {lessons.map((lesson, index) => (
                <div
                  key={lesson.id}
                  onClick={() => selectLesson(lesson)}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    currentLesson.id === lesson.id
                      ? "bg-indigo-50 border-2 border-indigo-500"
                      : "bg-slate-50 hover:bg-slate-100 border-2 border-transparent"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {lesson.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-900">
                        {index + 1}. {lesson.title}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        {lesson.duration_minutes} min
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
