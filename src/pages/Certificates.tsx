import { useEffect, useState } from 'react';
import { Award, Download } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Certificate {
  courseId: string;
  courseTitle: string;
  instructor: string;
  completedAt: string;
}

export function Certificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadCertificates();
  }, [user]);

  const loadCertificates = async () => {
    if (!user) return;

    try {
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select(`
          course_id,
          completed_at,
          courses (
            id,
            title,
            instructor
          )
        `)
        .eq('user_id', user.id)
        .not('completed_at', 'is', null);

      if (enrollments) {
        const certs = enrollments.map((enrollment: any) => ({
          courseId: enrollment.courses.id,
          courseTitle: enrollment.courses.title,
          instructor: enrollment.courses.instructor,
          completedAt: enrollment.completed_at,
        }));
        setCertificates(certs);
      }
    } catch (error) {
      console.error('Error loading certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <Layout title="Certificados">
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600">Carregando...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Certificados">
      {certificates.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            Nenhum certificado ainda
          </h3>
          <p className="text-slate-600">
            Complete cursos para ganhar certificados
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map((cert) => (
            <Card
              key={cert.courseId}
              className="p-6 border-2 border-indigo-200 bg-gradient-to-br from-white to-indigo-50"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <Button variant="ghost" size="sm">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Certificado de Conclusão
              </h3>
              <p className="text-lg font-medium text-indigo-900 mb-1">
                {cert.courseTitle}
              </p>
              <p className="text-sm text-slate-600 mb-4">
                Instrutor: {cert.instructor}
              </p>
              <div className="pt-4 border-t border-slate-200">
                <p className="text-sm text-slate-600">
                  Concluído em {formatDate(cert.completedAt)}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Layout>
  );
}
