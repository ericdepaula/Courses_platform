import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, PlayCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";

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
  video_url: string; // Nosso ID do Google Drive
  duration_minutes: number;
  order_index: number;
}

export function ManageCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false });

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
      setCourses(courses.filter((course) => course.id !== id));
    } catch (error) {
      console.error("Erro ao deletar curso:", error);
    }
  };

  // Estados para o Modal de Aulas
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [selectedCourseForLessons, setSelectedCourseForLessons] =
    useState<any>(null);
  const [courseLessons, setCourseLessons] = useState<Lesson[]>([]);
  const [isLoadingLessons, setIsLoadingLessons] = useState(false);

  // Estados para o Formulário de Nova Aula/Edição
  const [isFormView, setIsFormView] = useState(false);
  const [lessonFormData, setLessonFormData] = useState<Partial<Lesson>>({
    title: "",
    description: "",
    video_url: "",
    duration_minutes: 0,
    order_index: 1,
  });

  // 1. Buscar aulas quando abrir o modal
  const openLessonModal = async (course: any) => {
    setSelectedCourseForLessons(course);
    setIsLessonModalOpen(true);
    setIsFormView(false);
    setIsLoadingLessons(true);

    const { data, error } = await supabase
      .from("lessons")
      .select("*")
      .eq("course_id", course.id)
      .order("order_index", { ascending: true });

    if (!error && data) {
      setCourseLessons(data);
      // Sugere o próximo número de ordem
      setLessonFormData((prev) => ({ ...prev, order_index: data.length + 1 }));
    }
    setIsLoadingLessons(false);
  };

  // 2. Salvar uma nova aula (Insert)
  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data, error } = await supabase
      .from("lessons")
      .insert([
        {
          course_id: selectedCourseForLessons.id,
          title: lessonFormData.title,
          description: lessonFormData.description,
          video_url: lessonFormData.video_url, // O ID do Google Drive colado manualmente
          duration_minutes: lessonFormData.duration_minutes,
          order_index: lessonFormData.order_index,
        },
      ])
      .select();

    if (!error && data) {
      setCourseLessons([...courseLessons, data[0]]);
      setIsFormView(false); // Volta para a lista
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

  // 3. Excluir aula
  const handleDeleteLesson = async (lessonId: string) => {
    if (!window.confirm("Tem certeza que deseja excluir esta aula?")) return;

    const { error } = await supabase
      .from("lessons")
      .delete()
      .eq("id", lessonId);

    if (!error) {
      setCourseLessons(
        courseLessons.filter((lesson) => lesson.id !== lessonId),
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 text-center sm:text-left">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Cursos</h1>
          <p className="text-sm text-gray-500 mt-1">
            Crie, edite e remova cursos da plataforma.
          </p>
        </div>
        <Button className="flex items-center gap-2 w-full sm:w-auto justify-center">
          <Plus className="w-5 h-5" />
          Novo Curso
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Legenda */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Curso
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {courses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      Nenhum curso encontrado.
                    </td>
                  </tr>
                ) : (
                  courses.map((course) => (
                    <tr key={course.id} className="hover:bg-gray-50">
                      {/* Imagem e Título */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-start gap-4">
                          <img
                            className="h-12 w-12 rounded-md object-cover flex-shrink-0"
                            src={
                              course.thumbnail_url ||
                              "https://via.placeholder.com/150"
                            }
                            alt={course.title}
                          />
                          <div className="text-sm font-medium text-gray-900 text-left">
                            {course.title}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                          {course.category}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={() => openLessonModal(course)}
                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(course.id)}
                            className="text-red-600 hover:text-red-900 p-1"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* MODAL DE GERENCIAMENTO DE AULAS */}
          {isLessonModalOpen && selectedCourseForLessons && (
            <div className="fixed inset-0 bg-slate-900/75 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Cabeçalho do Modal */}
                <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">
                      Gerenciar Aulas
                    </h2>
                    <p className="text-sm text-slate-500">
                      Curso:{" "}
                      <span className="font-semibold text-indigo-600">
                        {selectedCourseForLessons.title}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => setIsLessonModalOpen(false)}
                    className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Corpo do Modal (Scrollável) */}
                <div className="p-6 overflow-y-auto flex-1">
                  {/* VISÃO A: Lista de Aulas */}
                  {!isFormView && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-slate-700">
                          Aulas Cadastradas ({courseLessons.length})
                        </h3>
                        <button
                          onClick={() => setIsFormView(true)}
                          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                        >
                          <Plus className="w-4 h-4" /> Nova Aula
                        </button>
                      </div>

                      {isLoadingLessons ? (
                        <p className="text-center text-slate-500 py-8">
                          Carregando aulas...
                        </p>
                      ) : courseLessons.length === 0 ? (
                        <div className="text-center py-10 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                          <p className="text-slate-500">
                            Nenhuma aula cadastrada ainda.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {courseLessons.map((lesson) => (
                            <div
                              key={lesson.id}
                              className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-indigo-300 transition-colors"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-bold">
                                  {lesson.order_index}
                                </div>
                                <div>
                                  <h4 className="font-medium text-slate-800">
                                    {lesson.title}
                                  </h4>
                                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                    <PlayCircle className="w-3 h-3" />{" "}
                                    {lesson.duration_minutes} min
                                    <span className="text-slate-300">|</span>
                                    <span>
                                      ID: {lesson.video_url || "Sem vídeo"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleDeleteLesson(lesson.id)}
                                  className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* VISÃO B: Formulário de Nova Aula */}
                  {isFormView && (
                    <form onSubmit={handleSaveLesson} className="space-y-5">
                      <h3 className="font-semibold text-slate-800 border-b pb-2 mb-4">
                        Adicionar Nova Aula
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-3">
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Título da Aula
                          </label>
                          <input
                            required
                            type="text"
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            value={lessonFormData.title}
                            onChange={(e) =>
                              setLessonFormData({
                                ...lessonFormData,
                                title: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="md:col-span-1">
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Ordem
                          </label>
                          <input
                            required
                            type="number"
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            value={lessonFormData.order_index}
                            onChange={(e) =>
                              setLessonFormData({
                                ...lessonFormData,
                                order_index: parseInt(e.target.value),
                              })
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Descrição
                        </label>
                        <textarea
                          rows={3}
                          className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          value={lessonFormData.description}
                          onChange={(e) =>
                            setLessonFormData({
                              ...lessonFormData,
                              description: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            ID do Google Drive
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: 1A2b3C4d5E6f..."
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                            value={lessonFormData.video_url}
                            onChange={(e) =>
                              setLessonFormData({
                                ...lessonFormData,
                                video_url: e.target.value,
                              })
                            }
                          />
                          <p className="text-xs text-slate-500 mt-1">
                            Cole apenas o ID do arquivo.
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Duração (Minutos)
                          </label>
                          <input
                            required
                            type="number"
                            min="0"
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            value={lessonFormData.duration_minutes}
                            onChange={(e) =>
                              setLessonFormData({
                                ...lessonFormData,
                                duration_minutes: parseInt(e.target.value),
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setIsFormView(false)}
                          className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                        >
                          Salvar Aula
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
