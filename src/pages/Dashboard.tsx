import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Play } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Course {
  id: string;
  title: string;
  instructor: string;
  thumbnail_url: string;
  category: string;
  level: string;
  duration_hours: number;
}

interface EnrolledCourse extends Course {
  progress: number;
  totalLessons: number;
  completedLessons: number;
}

export function Dashboard() {
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [recommendedCourses, setRecommendedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select(`
          course_id,
          courses (
            id,
            title,
            instructor,
            thumbnail_url,
            category,
            level,
            duration_hours
          )
        `)
        .eq('user_id', user.id);

      if (enrollments) {
        const coursesWithProgress = await Promise.all(
          enrollments.map(async (enrollment: any) => {
            const course = enrollment.courses;

            const { data: lessons } = await supabase
              .from('lessons')
              .select('id')
              .eq('course_id', course.id);

            const { data: progress } = await supabase
              .from('lesson_progress')
              .select('completed')
              .eq('user_id', user.id)
              .in(
                'lesson_id',
                lessons?.map((l) => l.id) || []
              );

            const totalLessons = lessons?.length || 0;
            const completedLessons =
              progress?.filter((p) => p.completed).length || 0;
            const progressPercentage =
              totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

            return {
              ...course,
              progress: Math.round(progressPercentage),
              totalLessons,
              completedLessons,
            };
          })
        );

        setEnrolledCourses(coursesWithProgress);
      }

      const { data: allCourses } = await supabase
        .from('courses')
        .select('*')
        .limit(3);

      if (allCourses) {
        const notEnrolled = allCourses.filter(
          (course) =>
            !enrollments?.some((e: any) => e.courses.id === course.id)
        );
        setRecommendedCourses(notEnrolled);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600">Carregando...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard">
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Cursos em Andamento
          </h2>
          {enrolledCourses.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-slate-600 mb-4">
                Você ainda não está matriculado em nenhum curso
              </p>
              <Button onClick={() => navigate('/explore')}>
                Explorar Cursos
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((course) => (
                <Card
                  key={course.id}
                  className="overflow-hidden"
                  hover
                  onClick={() => navigate(`/course/${course.id}`)}
                >
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-slate-900 mb-2">
                      {course.title}
                    </h3>
                    <p className="text-sm text-slate-600 mb-4">
                      {course.instructor}
                    </p>
                    <ProgressBar progress={course.progress} />
                    <div className="flex items-center justify-between mt-4 text-sm text-slate-600">
                      <span>
                        {course.completedLessons} de {course.totalLessons} aulas
                      </span>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/course/${course.id}`);
                        }}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Continuar
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Cursos Recomendados
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedCourses.map((course) => (
              <Card
                key={course.id}
                className="overflow-hidden"
                hover
                onClick={() => navigate(`/explore`)}
              >
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium px-2 py-1 bg-indigo-100 text-indigo-700 rounded">
                      {course.category}
                    </span>
                    <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-700 rounded">
                      {course.level}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mb-2">
                    {course.title}
                  </h3>
                  <p className="text-sm text-slate-600 mb-4">
                    {course.instructor}
                  </p>
                  <div className="flex items-center text-sm text-slate-600">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{course.duration_hours}h</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
}
