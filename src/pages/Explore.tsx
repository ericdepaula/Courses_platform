import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Search } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  thumbnail_url: string;
  category: string;
  level: string;
  duration_hours: number;
}

export function Explore() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadCourses();
  }, [user]);

  useEffect(() => {
    filterCourses();
  }, [searchTerm, selectedCategory, courses]);

  const loadCourses = async () => {
    try {
      const { data: coursesData } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (coursesData) {
        setCourses(coursesData);
      }

      if (user) {
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('course_id')
          .eq('user_id', user.id);

        if (enrollments) {
          setEnrolledCourseIds(new Set(enrollments.map((e) => e.course_id)));
        }
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCourses = () => {
    let filtered = courses;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((course) => course.category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredCourses(filtered);
  };

  const handleEnroll = async (courseId: string) => {
    if (!user) {
      navigate('/');
      return;
    }

    try {
      const { error } = await supabase.from('enrollments').insert({
        user_id: user.id,
        course_id: courseId,
      });

      if (!error) {
        setEnrolledCourseIds(new Set([...enrolledCourseIds, courseId]));
        navigate(`/course/${courseId}`);
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
    }
  };

  const categories = ['all', ...new Set(courses.map((c) => c.category))];

  if (loading) {
    return (
      <Layout title="Explorar Cursos">
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600">Carregando...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Explorar Cursos">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Buscar cursos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category === 'all' ? 'Todos' : category}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const isEnrolled = enrolledCourseIds.has(course.id);

            return (
              <Card key={course.id} className="overflow-hidden flex flex-col" hover>
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4 flex flex-col flex-1">
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
                  <p className="text-sm text-slate-600 mb-2 line-clamp-2 flex-1">
                    {course.description}
                  </p>
                  <p className="text-sm text-slate-700 mb-3">
                    {course.instructor}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-slate-600">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{course.duration_hours}h</span>
                    </div>
                    {isEnrolled ? (
                      <Button
                        size="sm"
                        onClick={() => navigate(`/course/${course.id}`)}
                      >
                        Acessar
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleEnroll(course.id)}
                      >
                        Matricular
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {filteredCourses.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-slate-600">Nenhum curso encontrado</p>
          </Card>
        )}
      </div>
    </Layout>
  );
}
