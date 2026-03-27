import { useState, useEffect } from "react";
import { Plus, Edit, Trash2 } from "lucide-react"; // Verifique se é 'lucide-react' no seu projeto
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";

interface Course {
  id: string;
  title: string;
  category: string;
  thumbnail_url: string;
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Responsivo */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 text-center sm:text-left">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Cursos</h1>
          <p className="text-sm text-gray-500 mt-1">Crie, edite e remova cursos da plataforma.</p>
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
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Curso</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {courses.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">Nenhum curso encontrado.</td>
                  </tr>
                ) : (
                  courses.map((course) => (
                    <tr key={course.id} className="hover:bg-gray-50">
                      {/* Imagem e Título Lado a Lado, Centralizados na Célula */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-4">
                          <img
                            className="h-12 w-12 rounded-md object-cover flex-shrink-0"
                            src={course.thumbnail_url || "https://via.placeholder.com/150"}
                            alt={course.title}
                          />
                          <div className="text-sm font-medium text-gray-900 text-left min-w-[120px]">
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
                          <button className="text-indigo-600 hover:text-indigo-900 p-1">
                            <Edit className="w-5 h-5" />
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
        </div>
      )}
    </div>
  );
}