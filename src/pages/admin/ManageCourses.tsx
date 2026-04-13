import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Edit2, FolderPlus, PlayCircle, Plus, Trash2, Users, X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { LoadingBlock, LoadingScreen } from "../../components/ui/LoadingScreen";

interface Course {
  id: string;
  title: string;
  category: string;
  thumbnail_url: string;
}

interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description: string;
  video_url: string;
  duration_minutes: number;
  order_index: number;
}

interface CourseAccessUser {
  id: string;
  email: string;
  role: string;
  hasAccess: boolean;
  enrolledAt: string | null;
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

function getCategoryPriority(title: string) {
  const category = getLessonCategoryLabel(title);
  if (category === "Teóricas") return 0;
  if (category === "Exercícios") return 1;
  return 2;
}

export function ManageCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [modalSection, setModalSection] = useState<"lessons" | "access" | "new-lesson">("lessons");
  const [selectedCourseForLessons, setSelectedCourseForLessons] = useState<Course | null>(null);
  const [selectedGroupName, setSelectedGroupName] = useState("");
  const [selectedGroupCourses, setSelectedGroupCourses] = useState<Course[]>([]);
  const [courseLessons, setCourseLessons] = useState<Lesson[]>([]);
  const [isLoadingLessons, setIsLoadingLessons] = useState(false);
  const [lessonFormData, setLessonFormData] = useState<Partial<Lesson>>({
    title: "",
    description: "",
    video_url: "",
    duration_minutes: 0,
    order_index: 1,
  });
  const [courseAccessUsers, setCourseAccessUsers] = useState<CourseAccessUser[]>([]);
  const [isLoadingAccess, setIsLoadingAccess] = useState(false);
  const [accessSearch, setAccessSearch] = useState("");
  const [accessError, setAccessError] = useState("");
  const [savingLessonId, setSavingLessonId] = useState<string | null>(null);
  const [selectedLessonCategory, setSelectedLessonCategory] = useState("Teóricas");

  useEffect(() => {
    void fetchCourses();
  }, []);

  const groupedCourses = useMemo(() => {
    return courses.reduce<Record<string, Course[]>>((groups, course) => {
      const groupKey = course.category || "Sem categoria";
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(course);
      return groups;
    }, {});
  }, [courses]);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("category", { ascending: true })
        .order("title", { ascending: true });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error("Erro ao buscar cursos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este curso?")) return;
    try {
      const { error } = await supabase.from("courses").delete().eq("id", id);
      if (error) throw error;
      setCourses((prev) => prev.filter((course) => course.id !== id));
    } catch (error) {
      console.error("Erro ao deletar curso:", error);
    }
  };

  const openLessonModal = async (groupName: string, groupCourses: Course[]) => {
    const firstCourse = groupCourses[0] || null;
    setSelectedCourseForLessons(firstCourse);
    setSelectedGroupName(groupName);
    setSelectedGroupCourses(groupCourses);
    setIsLessonModalOpen(true);
    setModalSection("lessons");
    setIsLoadingLessons(true);
    setIsLoadingAccess(true);
    setAccessError("");

    const [lessonsResult] = await Promise.all([
      firstCourse ? loadLessons(firstCourse.id) : Promise.resolve(),
      loadCourseAccess(groupCourses.map((course) => course.id)),
    ]);
    return lessonsResult;
  };

  const loadLessons = async (courseId: string) => {
    const { data, error } = await supabase
      .from("lessons")
      .select("*")
      .eq("course_id", courseId)
      .order("order_index", { ascending: true });

    if (!error && data) {
      const sortedLessons = [...data].sort((left, right) => {
        const categoryDelta = getCategoryPriority(left.title) - getCategoryPriority(right.title);
        if (categoryDelta !== 0) return categoryDelta;
        return left.order_index - right.order_index;
      });

      setCourseLessons(sortedLessons);
      setLessonFormData((prev) => ({ ...prev, order_index: data.length + 1 }));
      const nextCategory = sortedLessons[0] ? getLessonCategoryLabel(sortedLessons[0].title) : "Teóricas";
      setSelectedLessonCategory(nextCategory);
    }
    setIsLoadingLessons(false);
  };

  const normalizeLessonOrders = (lessons: Lesson[]) => {
    const categoryBases = {
      "Teóricas": 100,
      "Exercícios": 200,
      Aulas: 300,
    } as const;

    const grouped = lessons.reduce<Record<string, Lesson[]>>((groups, lesson) => {
      const category = getLessonCategoryLabel(lesson.title);
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(lesson);
      return groups;
    }, {});

    return ["Teóricas", "Exercícios", "Aulas"].flatMap((category) =>
      (grouped[category] || []).map((lesson, index) => ({
          ...lesson,
          order_index: categoryBases[category as keyof typeof categoryBases] + index + 1,
        })),
    );
  };

  const persistLessonOrder = async (nextLessons: Lesson[]) => {
    const normalizedLessons = normalizeLessonOrders(nextLessons);

    try {
      setSavingLessonId("bulk");

      const results = await Promise.all(
        normalizedLessons.map((lesson) =>
          supabase.from("lessons").update({ order_index: lesson.order_index }).eq("id", lesson.id),
        ),
      );

      const failed = results.find((result) => result.error);
      if (failed?.error) {
        throw failed.error;
      }

      setCourseLessons(normalizedLessons);
    } catch (error) {
      console.error("Erro ao atualizar ordem das aulas:", error);
      alert("Nao foi possivel reorganizar as aulas.");
      if (selectedCourseForLessons) {
        await loadLessons(selectedCourseForLessons.id);
      }
    } finally {
      setSavingLessonId(null);
    }
  };

  const moveLesson = async (lessonId: string, direction: "up" | "down") => {
    const sourceLesson = courseLessons.find((lesson) => lesson.id === lessonId);
    if (!sourceLesson) return;

    const category = getLessonCategoryLabel(sourceLesson.title);
    const sameCategoryLessons = courseLessons
      .filter((lesson) => getLessonCategoryLabel(lesson.title) === category)
      .sort((left, right) => left.order_index - right.order_index);

    const currentIndex = sameCategoryLessons.findIndex((lesson) => lesson.id === lessonId);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (currentIndex === -1 || targetIndex < 0 || targetIndex >= sameCategoryLessons.length) {
      return;
    }

    const reorderedCategoryLessons = [...sameCategoryLessons];
    const [movedLesson] = reorderedCategoryLessons.splice(currentIndex, 1);
    reorderedCategoryLessons.splice(targetIndex, 0, movedLesson);

    const reorderedQueue = [...reorderedCategoryLessons];
    const nextLessons = courseLessons.map((lesson) =>
      getLessonCategoryLabel(lesson.title) === category ? reorderedQueue.shift() || lesson : lesson,
    );

    await persistLessonOrder(nextLessons);
  };

  const loadCourseAccess = async (courseIds: string[]) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      const query = new URLSearchParams({ courseIds: courseIds.join(",") }).toString();
      const response = await fetch(`/api/course-access?${query}`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Erro ao carregar acessos");
      }

      setCourseAccessUsers(payload.users || []);
    } catch (error) {
      setAccessError(error instanceof Error ? error.message : "Erro ao carregar acessos");
    } finally {
      setIsLoadingAccess(false);
    }
  };

  const handleSaveLesson = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedCourseForLessons || selectedGroupCourses.length === 0) return;

    const { data, error } = await supabase
      .from("lessons")
      .insert([
        {
          course_id: selectedCourseForLessons.id,
          title: lessonFormData.title,
          description: lessonFormData.description,
          video_url: lessonFormData.video_url,
          duration_minutes: lessonFormData.duration_minutes,
          order_index: lessonFormData.order_index,
        },
      ])
      .select();

    if (!error && data) {
      setCourseLessons((prev) => [...prev, data[0]]);
      setModalSection("lessons");
      setLessonFormData({
        title: "",
        description: "",
        video_url: "",
        duration_minutes: 0,
        order_index: courseLessons.length + 2,
      });
    } else {
      alert("Erro ao salvar aula.");
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!window.confirm("Tem certeza que deseja excluir esta aula?")) return;

    const { error } = await supabase.from("lessons").delete().eq("id", lessonId);
    if (!error) {
      setCourseLessons((prev) => prev.filter((lesson) => lesson.id !== lessonId));
    }
  };

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((current) => ({
      ...current,
      [groupName]: !current[groupName],
    }));
  };

  const updateCourseAccess = async (method: "POST" | "DELETE", userId: string) => {
    if (selectedGroupCourses.length === 0) return;

    try {
      setAccessError("");
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      const response = await fetch("/api/course-access", {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          courseIds: selectedGroupCourses.map((course) => course.id),
          userId,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Erro ao atualizar acesso");
      }

      setCourseAccessUsers(payload.users || []);
    } catch (error) {
      setAccessError(error instanceof Error ? error.message : "Erro ao atualizar acesso");
    }
  };

  const filteredAccessUsers = courseAccessUsers.filter((user) =>
    user.email.toLowerCase().includes(accessSearch.toLowerCase()),
  );

  const lessonsByCategory = useMemo(() => {
    return courseLessons.reduce<Record<string, Lesson[]>>((groups, lesson) => {
      const key = getLessonCategoryLabel(lesson.title);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(lesson);
      return groups;
    }, {});
  }, [courseLessons]);

  const lessonCategoryOptions = useMemo(() => {
    return ["Teóricas", "Exercícios", "Aulas"].filter((category) => (lessonsByCategory[category] || []).length > 0);
  }, [lessonsByCategory]);

  const filteredLessons = useMemo(() => {
    return (lessonsByCategory[selectedLessonCategory] || []).slice().sort((left, right) => left.order_index - right.order_index);
  }, [lessonsByCategory, selectedLessonCategory]);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-kicker mb-2">Administração</p>
            <h1 className="headline-display text-4xl text-[var(--text-strong)] lg:text-5xl">
              Gerenciar cursos
            </h1>
          </div>
          <Button size="lg">
            <FolderPlus className="h-5 w-5" />
            Novo curso
          </Button>
        </div>
      </Card>

      {loading ? (
        <LoadingScreen
          label="Carregando cursos"
        />
      ) : (
        <div className="grid gap-4">
          {courses.length === 0 ? (
            <Card className="p-10 text-center text-[var(--text-muted)]">Nenhum curso encontrado.</Card>
          ) : (
            Object.entries(groupedCourses).map(([groupName, groupedItems]) => {
              const isExpanded = expandedGroups[groupName] ?? false;

              return (
                <Card key={groupName} className="p-5">
                  <div className="flex w-full items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-[1.25rem] bg-[var(--brand-blue)] text-white">
                        <PlayCircle className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                          Curso
                        </p>
                        <h3 className="mt-1 text-2xl font-bold text-[var(--text-strong)]">{groupName}</h3>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">
                          {groupedItems.length} matérias
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" onClick={() => openLessonModal(groupName, groupedItems)}>
                        <Edit2 className="h-4 w-4" />
                        Gerenciar curso
                      </Button>
                      <button
                        type="button"
                        onClick={() => toggleGroup(groupName)}
                        className="rounded-full p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-soft)]"
                        aria-label={isExpanded ? "Recolher matérias" : "Expandir matérias"}
                      >
                        <ChevronDown
                          className={`h-5 w-5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </button>
                    </div>
                  </div>

                  {isExpanded ? (
                    <div className="mt-5 space-y-3 border-t border-[var(--stroke-soft)] pt-5">
                      {groupedItems.map((course) => (
                        <div
                          key={course.id}
                          className="surface-subtle flex flex-col gap-4 rounded-[1rem] p-4 lg:flex-row lg:items-center lg:justify-between"
                        >
                          <div className="flex items-center gap-4">
                            {course.thumbnail_url ? (
                              <img
                                className="h-14 w-14 rounded-[1rem] object-cover"
                                src={course.thumbnail_url}
                                alt={course.title}
                              />
                            ) : (
                              <div className="flex h-14 w-14 items-center justify-center rounded-[1rem] bg-[var(--bg-muted)] text-[var(--text-strong)]">
                                <PlayCircle className="h-5 w-5" />
                              </div>
                            )}
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                                Matéria
                              </p>
                              <h4 className="mt-1 text-xl font-bold text-[var(--text-strong)]">
                                {course.title}
                              </h4>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            <Button variant="ghost" onClick={() => handleDelete(course.id)}>
                              <Trash2 className="h-4 w-4" />
                              Excluir matéria
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </Card>
              );
            })
          )}
        </div>
      )}

      {isLessonModalOpen && selectedCourseForLessons && selectedGroupCourses.length > 0 && (
        <div className="fixed inset-0 z-[90]">
          <div className="absolute inset-0 bg-[#030712]/72 backdrop-blur-md" onClick={() => setIsLessonModalOpen(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="glass-panel relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem]">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div>
                <p className="section-kicker mb-2">Curso selecionado</p>
                <h2 className="text-2xl font-bold text-[var(--text-strong)]">{selectedGroupName}</h2>
              </div>
              <button
                onClick={() => setIsLessonModalOpen(false)}
                className="rounded-full p-2 text-[var(--text-strong)] transition-colors hover:bg-[var(--bg-soft)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {modalSection !== "new-lesson" ? (
                <div className="space-y-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-[var(--text-muted)]">Matéria atual</p>
                      <h3 className="text-2xl font-bold text-[var(--text-strong)]">
                        {selectedCourseForLessons.title}
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant={modalSection === "lessons" ? "primary" : "secondary"} onClick={() => setModalSection("lessons")}>
                        Aulas
                      </Button>
                      <Button variant={modalSection === "access" ? "primary" : "secondary"} onClick={() => setModalSection("access")}>
                        <Users className="h-4 w-4" />
                        Acesso
                      </Button>
                      <Button onClick={() => setModalSection("new-lesson")}>
                        <Plus className="h-4 w-4" />
                        Nova aula
                      </Button>
                    </div>
                  </div>

                  {modalSection === "lessons" && isLoadingLessons ? (
                    <LoadingBlock label="Carregando aulas" />
                  ) : modalSection === "lessons" && courseLessons.length === 0 ? (
                    <Card className="p-8 text-center text-[var(--text-muted)]">Nenhuma aula cadastrada.</Card>
                  ) : null}

                  {modalSection === "lessons" ? (
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {selectedGroupCourses.map((course) => (
                          <Button
                            key={course.id}
                            variant={selectedCourseForLessons?.id === course.id ? "primary" : "secondary"}
                            onClick={() => {
                              setSelectedCourseForLessons(course);
                              setIsLoadingLessons(true);
                              void loadLessons(course.id);
                            }}
                          >
                            {course.title}
                          </Button>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-2">
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

                      <div className="space-y-3">
                      {filteredLessons.map((lesson, index) => (
                        <div
                          key={lesson.id}
                          className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-3"
                        >
                          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                            <div className="flex min-w-0 items-center gap-4">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 font-bold text-[var(--text-strong)]">
                                {index + 1}
                              </div>
                              <div className="min-w-0">
                                <h4 className="truncate font-semibold text-[var(--text-strong)]">
                                  {getLessonDisplayTitle(lesson.title)}
                                </h4>
                                <p className="mt-1 text-sm text-[var(--text-muted)]">
                                  {lesson.duration_minutes} min
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              <Button
                                variant="secondary"
                                onClick={() => void moveLesson(lesson.id, "up")}
                                disabled={savingLessonId !== null || index === 0}
                              >
                                <ArrowUp className="h-4 w-4" />
                                Subir
                              </Button>
                              <Button
                                variant="secondary"
                                onClick={() => void moveLesson(lesson.id, "down")}
                                disabled={savingLessonId !== null || index === filteredLessons.length - 1}
                              >
                                <ArrowDown className="h-4 w-4" />
                                Descer
                              </Button>
                              <Button variant="ghost" onClick={() => handleDeleteLesson(lesson.id)}>
                                <Trash2 className="h-4 w-4" />
                                Remover
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      </div>
                    </div>
                  ) : null}

                  {modalSection === "access" ? (
                    <div className="space-y-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-[var(--text-muted)]">Usuários com acesso ao curso</p>
                          <h3 className="text-2xl font-bold text-[var(--text-strong)]">
                            {courseAccessUsers.filter((user) => user.hasAccess).length} com acesso
                          </h3>
                        </div>
                        <input
                          type="text"
                          value={accessSearch}
                          onChange={(event) => setAccessSearch(event.target.value)}
                          placeholder="Buscar por email"
                          className="w-full rounded-[1rem] border border-[var(--stroke-soft)] bg-[var(--bg-soft)] px-4 py-3 text-[var(--text-strong)] sm:max-w-xs"
                        />
                      </div>

                      {accessError ? (
                        <div className="rounded-[1rem] border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">
                          {accessError}
                        </div>
                      ) : null}

                      {isLoadingAccess ? (
                        <LoadingBlock label="Carregando usuários" />
                      ) : (
                        <div className="space-y-3">
                          {filteredAccessUsers.map((user) => (
                            <div
                              key={user.id}
                              className="surface-subtle flex flex-col gap-3 rounded-[1rem] p-4 lg:flex-row lg:items-center lg:justify-between"
                            >
                              <div>
                                <p className="font-semibold text-[var(--text-strong)]">{user.email}</p>
                                <p className="mt-1 text-sm text-[var(--text-muted)]">
                                  {user.role === "admin" ? "Administrador" : "Usuário"}
                                  {user.hasAccess && user.enrolledAt
                                    ? ` • acesso concedido em ${new Date(user.enrolledAt).toLocaleDateString("pt-BR")}`
                                    : ""}
                                </p>
                              </div>
                              {user.hasAccess ? (
                                <Button variant="ghost" onClick={() => updateCourseAccess("DELETE", user.id)}>
                                  Remover acesso
                                </Button>
                              ) : (
                                <Button variant="secondary" onClick={() => updateCourseAccess("POST", user.id)}>
                                  Conceder acesso
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {modalSection === "new-lesson" ? (
                <form onSubmit={handleSaveLesson} className="space-y-5">
                  <div>
                    <p className="section-kicker mb-2">Nova aula</p>
                    <h3 className="text-2xl font-bold text-[var(--text-strong)]">Adicionar item ao curso</h3>
                  </div>

                  <div className="grid gap-4 md:grid-cols-[1fr_140px]">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-[var(--text-strong)]">Título</span>
                      <input
                        required
                        type="text"
                        className="w-full rounded-[1.25rem] border border-[var(--stroke-soft)] bg-[var(--bg-soft)] px-4 py-3 text-[var(--text-strong)]"
                        value={lessonFormData.title}
                        onChange={(event) =>
                          setLessonFormData({ ...lessonFormData, title: event.target.value })
                        }
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-[var(--text-strong)]">Ordem</span>
                      <input
                        required
                        type="number"
                        className="w-full rounded-[1.25rem] border border-[var(--stroke-soft)] bg-[var(--bg-soft)] px-4 py-3 text-[var(--text-strong)]"
                        value={lessonFormData.order_index}
                        onChange={(event) =>
                          setLessonFormData({
                            ...lessonFormData,
                            order_index: Number(event.target.value),
                          })
                        }
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-[var(--text-strong)]">Descrição</span>
                    <textarea
                      rows={4}
                      className="w-full rounded-[1.25rem] border border-[var(--stroke-soft)] bg-[var(--bg-soft)] px-4 py-3 text-[var(--text-strong)]"
                      value={lessonFormData.description}
                      onChange={(event) =>
                        setLessonFormData({ ...lessonFormData, description: event.target.value })
                      }
                    />
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-[var(--text-strong)]">ID do Google Drive</span>
                      <input
                        type="text"
                        placeholder="Ex: 1A2b3C4d5E6f"
                        className="w-full rounded-[1.25rem] border border-[var(--stroke-soft)] bg-[var(--bg-soft)] px-4 py-3 font-mono text-[var(--text-strong)]"
                        value={lessonFormData.video_url}
                        onChange={(event) =>
                          setLessonFormData({ ...lessonFormData, video_url: event.target.value })
                        }
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-[var(--text-strong)]">Duração</span>
                      <input
                        required
                        type="number"
                        min="0"
                        className="w-full rounded-[1.25rem] border border-[var(--stroke-soft)] bg-[var(--bg-soft)] px-4 py-3 text-[var(--text-strong)]"
                        value={lessonFormData.duration_minutes}
                        onChange={(event) =>
                          setLessonFormData({
                            ...lessonFormData,
                            duration_minutes: Number(event.target.value),
                          })
                        }
                      />
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
                    <Button type="button" variant="ghost" onClick={() => setModalSection("lessons")}>
                      Cancelar
                    </Button>
                    <Button type="submit">Salvar aula</Button>
                  </div>
                </form>
              ) : null}
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
