import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Circle, Maximize, Minimize, Pause, Play, PlayCircle } from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { LoadingBlock, LoadingScreen } from "../components/ui/LoadingScreen";
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
  category: string;
}

function getLessonCategoryLabel(title: string) {
  const match = title.match(/^\[(.+?)\]\s*/);
  const raw = match?.[1]?.trim().toLowerCase();

  if (raw?.startsWith("teor")) return "Teóricas";
  if (raw?.startsWith("exerc")) return "Exercícios";
  return "Aulas";
}

function getLessonDisplayTitle(title: string) {
  return title.replace(/^\[(.+?)\]\s*/, "").trim();
}

export function CourseViewer() {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(true);
  const [videoToken, setVideoToken] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState("");
  const [selectedLessonCategory, setSelectedLessonCategory] = useState("Teóricas");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPlayerControls, setShowPlayerControls] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<HTMLDivElement | null>(null);
  const controlsTimeoutRef = useRef<number | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (courseId) {
      void loadCourseData();
    }
  }, [courseId, user]);

  useEffect(() => {
    if (currentLesson && user) {
      void loadVideoSession(currentLesson.id);
    } else {
      setVideoToken(null);
    }
  }, [currentLesson, user]);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [videoToken, currentLesson?.id]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === playerRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        window.clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  const loadCourseData = async () => {
    if (!courseId || !user) return;

    setLoading(true);
    setHasAccess(true);

    try {
      const { data: enrollment } = await supabase
        .from("enrollments")
        .select("id")
        .eq("user_id", user.id)
        .eq("course_id", courseId)
        .maybeSingle();

      if (!enrollment) {
        setHasAccess(false);
        setCourse(null);
        setLessons([]);
        setCurrentLesson(null);
        return;
      }

      const { data: courseData } = await supabase
        .from("courses")
        .select("id, title, description, instructor, category")
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

      if (lessonsData) {
        let lessonsWithProgress: Lesson[] = lessonsData.map((lesson) => ({
          ...lesson,
          completed: false,
        }));

        if (lessonsData.length > 0) {
          const { data: progressData } = await supabase
            .from("lesson_progress")
            .select("*")
            .eq("user_id", user.id)
            .in("lesson_id", lessonsData.map((lesson) => lesson.id));

          lessonsWithProgress = lessonsData.map((lesson) => ({
            ...lesson,
            completed:
              progressData?.find((progress) => progress.lesson_id === lesson.id)?.completed || false,
          }));
        }

        setLessons(lessonsWithProgress);
        setCurrentLesson(lessonsWithProgress[0] || null);
        setSelectedLessonCategory(
          lessonsWithProgress[0] ? getLessonCategoryLabel(lessonsWithProgress[0].title) : "Teóricas",
        );
      }
    } catch (error) {
      console.error("Error loading course data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadVideoSession = async (lessonId: string) => {
    try {
      setVideoLoading(true);
      setVideoError("");
      setVideoToken(null);

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      const query = new URLSearchParams({ lessonId }).toString();
      const response = await fetch(`/api/video-session?${query}`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Erro ao iniciar vídeo");
      }

      setVideoToken(payload.token);
    } catch (error) {
      setVideoError(error instanceof Error ? error.message : "Erro ao iniciar vídeo");
    } finally {
      setVideoLoading(false);
    }
  };

  const toggleLessonComplete = async (lessonId: string, completed: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase.from("lesson_progress").upsert(
        {
          user_id: user.id,
          lesson_id: lessonId,
          completed,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,lesson_id" },
      );

      if (!error) {
        setLessons((prev) =>
          prev.map((lesson) => (lesson.id === lessonId ? { ...lesson, completed } : lesson)),
        );
        setCurrentLesson((prev) => (prev && prev.id === lessonId ? { ...prev, completed } : prev));
      }
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  };

  const progress = useMemo(() => {
    const completed = lessons.filter((lesson) => lesson.completed).length;
    return lessons.length ? Math.round((completed / lessons.length) * 100) : 0;
  }, [lessons]);

  const lessonsByCategory = useMemo(() => {
    return lessons.reduce<Record<string, Lesson[]>>((groups, lesson) => {
      const key = getLessonCategoryLabel(lesson.title);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(lesson);
      return groups;
    }, {});
  }, [lessons]);

  const lessonCategoryOptions = useMemo(() => Object.keys(lessonsByCategory), [lessonsByCategory]);

  const filteredLessons = useMemo(() => {
    return lessonsByCategory[selectedLessonCategory] || [];
  }, [lessonsByCategory, selectedLessonCategory]);

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
  };

  const togglePlayback = () => {
    if (!videoRef.current) return;

    if (videoRef.current.paused) {
      void videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  };

  const handleSeek = (value: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = value;
    setCurrentTime(value);
  };

  const scheduleControlsHide = () => {
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }

    controlsTimeoutRef.current = window.setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setShowPlayerControls(false);
      }
    }, 2200);
  };

  const revealControls = () => {
    setShowPlayerControls(true);
    scheduleControlsHide();
  };

  const toggleFullscreen = async () => {
    if (!playerRef.current) return;

    if (document.fullscreenElement === playerRef.current) {
      await document.exitFullscreen();
      return;
    }

    await playerRef.current.requestFullscreen();
  };

  if (loading) {
    return (
      <Layout title="Aula">
        <LoadingScreen
          label="Abrindo matéria"
        />
      </Layout>
    );
  }

  if (!hasAccess) {
    return (
      <Layout title="Acesso restrito">
        <Card className="p-10 text-center">
          <h3 className="headline-display text-3xl text-[var(--text-strong)]">Acesso restrito</h3>
          <p className="mt-3 text-[var(--text-muted)]">
            Esta matéria não está liberada para a sua conta.
          </p>
          <div className="mt-6">
            <Button onClick={() => navigate("/dashboard")}>Voltar ao painel</Button>
          </div>
        </Card>
      </Layout>
    );
  }

  if (!course || !currentLesson) {
    return (
      <Layout title="Curso não encontrado">
        <Card className="p-10 text-center">
          <h3 className="headline-display text-3xl text-[var(--text-strong)]">Curso não encontrado</h3>
          <p className="mt-3 text-[var(--text-muted)]">Esta matéria não está mais disponível no catálogo.</p>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout title={course.title}>
      <div className="space-y-6">
        <div>
          <button
            type="button"
            onClick={() => navigate(`/course-group/${encodeURIComponent(course.category)}`)}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--bg-soft)] px-4 py-2 text-sm font-semibold text-[var(--text-strong)] transition-colors hover:bg-[var(--bg-muted)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para matérias
          </button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <Card className="overflow-hidden">
              <div
                ref={playerRef}
                className="relative aspect-video overflow-hidden rounded-[1.5rem] bg-[#050b17] shadow-[0_24px_80px_rgba(3,8,18,0.36)]"
                onMouseMove={revealControls}
                onMouseLeave={() => {
                  if (isPlaying) {
                    setShowPlayerControls(false);
                  }
                }}
                onClick={revealControls}
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_40%),linear-gradient(180deg,rgba(5,11,23,0.06),rgba(5,11,23,0.32))]" />
                {videoLoading ? (
                  <div className="flex h-full items-center justify-center bg-black/20 backdrop-blur-[2px]">
                    <LoadingBlock label="Carregando vídeo" />
                  </div>
                ) : videoToken ? (
                  <>
                    <video
                      key={videoToken}
                      ref={videoRef}
                      className="absolute inset-0 h-full w-full bg-black object-contain"
                      autoPlay
                      playsInline
                      preload="metadata"
                      disablePictureInPicture
                      onContextMenu={(event) => event.preventDefault()}
                      onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
                      onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
                      onPlay={() => {
                        setIsPlaying(true);
                        scheduleControlsHide();
                      }}
                      onPause={() => {
                        setIsPlaying(false);
                        setShowPlayerControls(true);
                      }}
                      src={`/api/video-stream?token=${encodeURIComponent(videoToken)}`}
                    >
                      Seu navegador não suporta reprodução de vídeo.
                    </video>

                    <button
                      type="button"
                      onClick={togglePlayback}
                      className="absolute inset-0 flex items-center justify-center"
                      aria-label={isPlaying ? "Pausar vídeo" : "Reproduzir vídeo"}
                    >
                      {!isPlaying && showPlayerControls ? (
                        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-black/45 text-white shadow-lg backdrop-blur-sm transition-transform hover:scale-105">
                          <Play className="ml-1 h-8 w-8" />
                        </span>
                      ) : null}
                    </button>

                    <div
                      className={`absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-4 pb-4 pt-10 transition-opacity duration-200 ${
                        showPlayerControls ? "opacity-100" : "pointer-events-none opacity-0"
                      }`}
                    >
                      <div className="mb-3 flex items-end justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
                            {getLessonCategoryLabel(currentLesson.title)}
                          </p>
                          <h3 className="mt-1 truncate text-lg font-semibold text-white">
                            {getLessonDisplayTitle(currentLesson.title)}
                          </h3>
                        </div>
                        <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-sm">
                          {currentLesson.duration_minutes} min
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={togglePlayback}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                          aria-label={isPlaying ? "Pausar vídeo" : "Reproduzir vídeo"}
                        >
                          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
                        </button>
                        <span className="w-10 text-xs font-medium text-white/75">{formatTime(currentTime)}</span>
                        <input
                          type="range"
                          min={0}
                          max={duration || 0}
                          step={0.1}
                          value={Math.min(currentTime, duration || 0)}
                          onChange={(event) => handleSeek(Number(event.target.value))}
                          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/20 accent-[var(--brand-blue)]"
                        />
                        <button
                          type="button"
                          onClick={toggleFullscreen}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                          aria-label={isFullscreen ? "Sair da tela cheia" : "Entrar em tela cheia"}
                        >
                          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                        </button>
                        <span className="w-10 text-right text-xs font-medium text-white/75">
                          {formatTime(duration)}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center p-6">
                    <div className="max-w-md text-center">
                      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
                        <PlayCircle className="h-10 w-10 text-[var(--brand-blue)]" />
                      </div>
                      <h3 className="headline-display text-3xl text-[var(--text-strong)]">Vídeo indisponível</h3>
                      <p className="mt-3 text-[var(--text-muted)]">
                        {videoError || "Não foi possível preparar a reprodução desta aula."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <div className="border-b border-white/10 pb-5">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--brand-blue)]">
                    Aula selecionada
                  </p>
                  <h3 className="mt-2 text-3xl font-bold text-[var(--text-strong)]">
                    {getLessonDisplayTitle(currentLesson.title)}
                  </h3>
                  <p className="mt-2 text-sm text-[var(--brand-blue)]">
                    {getLessonCategoryLabel(currentLesson.title)}
                  </p>
                  <p className="mt-3 text-sm text-[var(--text-muted)]">{currentLesson.duration_minutes} minutos</p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-4 lg:p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="section-kicker mb-2">Mapa da matéria</p>
                <h3 className="headline-display text-3xl text-[var(--text-strong)]">{course.title}</h3>
              </div>
              <span className="rounded-full bg-[var(--bg-soft)] px-3 py-2 text-xs font-semibold text-[var(--text-strong)]">
                {progress}% concluído
              </span>
            </div>
            <div className="mb-5 flex flex-wrap gap-2">
              {lessonCategoryOptions.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedLessonCategory(category)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    selectedLessonCategory === category
                      ? "bg-[var(--text-strong)] text-[var(--bg-base)]"
                      : "bg-[var(--bg-soft)] text-[var(--text-strong)] hover:bg-[var(--bg-muted)]"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            <div className="space-y-5">
              {filteredLessons.map((lesson, index) => {
                const isActive = currentLesson.id === lesson.id;
                return (
                  <button
                    key={lesson.id}
                    onClick={() => setCurrentLesson(lesson)}
                    className={`w-full rounded-[1.5rem] border p-4 text-left transition-all ${
                      isActive
                        ? "border-[var(--brand-blue)] bg-[var(--bg-soft)]"
                        : "border-[var(--stroke-soft)] bg-[var(--bg-base)] hover:bg-[var(--bg-soft)]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        className="pt-1"
                        onClick={(event) => {
                          event.stopPropagation();
                          void toggleLessonComplete(lesson.id, !lesson.completed);
                        }}
                        aria-label={lesson.completed ? "Desmarcar como concluída" : "Marcar como concluída"}
                      >
                        {lesson.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-[var(--brand-blue)]" />
                        ) : (
                          <Circle className="h-5 w-5 text-[var(--text-muted)]" />
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                          Aula {index + 1}
                        </p>
                        <h4 className="mt-2 text-lg font-semibold text-[var(--text-strong)]">
                          {getLessonDisplayTitle(lesson.title)}
                        </h4>
                        <p className="mt-2 text-sm text-[var(--text-muted)]">
                          {lesson.duration_minutes} minutos
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
