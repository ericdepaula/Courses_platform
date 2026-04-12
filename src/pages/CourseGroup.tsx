import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronRight, Clock3, PlayCircle } from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { LoadingScreen } from "../components/ui/LoadingScreen";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

interface CourseMatter {
  id: string;
  title: string;
  category: string;
  thumbnail_url: string;
  duration_hours: number;
}

type EnrollmentRow = {
  course_id: string;
};

export function CourseGroup() {
  const { groupName } = useParams<{ groupName: string }>();
  const decodedGroupName = decodeURIComponent(groupName || "");
  const [matters, setMatters] = useState<CourseMatter[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    void loadGroup();
  }, [decodedGroupName, user]);

  const loadGroup = async () => {
    if (!user || !decodedGroupName) {
      setMatters([]);
      setLoading(false);
      return;
    }

    try {
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("course_id")
        .eq("user_id", user.id);

      const rows = (enrollments as EnrollmentRow[] | null) || [];
      const courseIds = [...new Set(rows.map((row) => row.course_id).filter(Boolean))];
      if (courseIds.length === 0) {
        setMatters([]);
        return;
      }

      const { data: courseRows, error: coursesError } = await supabase
        .from("courses")
        .select("id, title, category, thumbnail_url, duration_hours")
        .in("id", courseIds);

      if (coursesError) {
        throw coursesError;
      }

      const availableMatters = ((courseRows || []) as CourseMatter[])
        .filter((course) => course.category === decodedGroupName)
        .sort((left, right) => left.title.localeCompare(right.title));

      setMatters(availableMatters);
    } catch (error) {
      console.error("Erro ao carregar matérias:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalHours = useMemo(
    () => matters.reduce((acc, matter) => acc + (matter.duration_hours || 0), 0),
    [matters],
  );

  if (loading) {
    return (
      <Layout title={decodedGroupName || "Curso"}>
        <LoadingScreen
          label="Abrindo matérias"
        />
      </Layout>
    );
  }

  return (
    <Layout title={decodedGroupName || "Curso"}>
      <div className="space-y-6">
        <Card className="p-6">
          <p className="section-kicker mb-2">Curso</p>
          <h2 className="headline-display text-4xl text-[var(--text-strong)]">{decodedGroupName}</h2>
          <p className="mt-3 text-[var(--text-muted)]">
            Selecione uma matéria para acessar as aulas liberadas para a sua conta.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full bg-[var(--bg-soft)] px-4 py-2 text-[var(--text-strong)]">
              {matters.length} matérias
            </span>
            <span className="rounded-full bg-[var(--bg-soft)] px-4 py-2 text-[var(--text-strong)]">
              {totalHours}h estimadas
            </span>
          </div>
        </Card>

        {matters.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-[var(--text-muted)]">Nenhuma matéria disponível para este curso.</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {matters.map((matter) => (
              <Card
                key={matter.id}
                className="overflow-hidden p-4"
                hover
                onClick={() => navigate(`/course/${matter.id}`)}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    {matter.thumbnail_url ? (
                      <img
                        src={matter.thumbnail_url}
                        alt={matter.title}
                        className="h-16 w-16 rounded-[1rem] object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-[1rem] bg-[var(--bg-soft)] text-[var(--brand-blue)]">
                        <PlayCircle className="h-6 w-6" />
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                        Matéria
                      </p>
                      <h3 className="mt-1 text-2xl font-bold text-[var(--text-strong)]">{matter.title}</h3>
                      <div className="mt-2 flex items-center gap-2 text-sm text-[var(--text-muted)]">
                        <Clock3 className="h-4 w-4" />
                        {matter.duration_hours || 0}h estimadas
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      navigate(`/course/${matter.id}`);
                    }}
                  >
                    Entrar
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
