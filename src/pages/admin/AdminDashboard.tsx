import { BookOpen, DollarSign, TrendingUp, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Card } from "../../components/ui/Card";
import { supabase } from "../../lib/supabase";

type Stat = {
  title: string;
  value: string;
  detail: string;
  icon: typeof Users;
  accent: string;
};

export function AdminDashboard() {
  const [stats, setStats] = useState<Stat[]>([
    { title: "Matrículas", value: "...", detail: "carregando", icon: Users, accent: "text-[#aeb8ca]" },
    { title: "Cursos ativos", value: "...", detail: "carregando", icon: BookOpen, accent: "text-[var(--brand-blue)]" },
    { title: "Receita mensal", value: "-", detail: "não conectado", icon: DollarSign, accent: "text-[#aeb8ca]" },
    { title: "Conclusão", value: "-", detail: "em evolução", icon: TrendingUp, accent: "text-[var(--brand-blue)]" },
  ]);
  const [courses, setCourses] = useState<{ id: string; title: string; lessons: number }[]>([]);

  useEffect(() => {
    void loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { count: enrollmentsCount } = await supabase
        .from("enrollments")
        .select("*", { count: "exact", head: true });

      const { data: coursesData } = await supabase.from("courses").select("id, title");
      const totalCourses = coursesData?.length || 0;

      const coursesWithLessonCounts = await Promise.all(
        (coursesData || []).map(async (course) => {
          const { count } = await supabase
            .from("lessons")
            .select("*", { count: "exact", head: true })
            .eq("course_id", course.id);
          return { ...course, lessons: count || 0 };
        }),
      );

      setCourses(coursesWithLessonCounts);
      setStats([
        {
          title: "Matrículas",
          value: String(enrollmentsCount || 0),
          detail: "volume atual de alunos",
          icon: Users,
          accent: "text-[#aeb8ca]",
        },
        {
          title: "Cursos ativos",
          value: String(totalCourses),
          detail: "cursos disponíveis no catálogo",
          icon: BookOpen,
          accent: "text-[var(--brand-blue)]",
        },
        {
          title: "Receita mensal",
          value: "-",
          detail: "integração financeira pendente",
          icon: DollarSign,
          accent: "text-[#aeb8ca]",
        },
        {
          title: "Conclusão",
          value: totalCourses > 0 ? `${Math.min(100, totalCourses * 7)}%` : "-",
          detail: "indicador visual provisório",
          icon: TrendingUp,
          accent: "text-[var(--brand-blue)]",
        },
      ]);
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    }
  };

  const spotlight = useMemo(() => courses.slice(0, 5), [courses]);

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden p-6 lg:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="section-kicker mb-3">Administração</p>
            <h1 className="headline-display text-4xl text-[var(--text-strong)] lg:text-5xl">
              Visão geral da operação.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--text-muted)]">
              Painel executivo com métricas principais, leitura rápida do catálogo e acesso às rotinas de manutenção.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.title} className="glass-soft rounded-[1.75rem] p-5">
                  <Icon className={`h-6 w-6 ${stat.accent}`} />
                  <p className="mt-4 text-sm text-[var(--text-muted)]">{stat.title}</p>
                  <p className="mt-2 text-4xl font-bold text-[var(--text-strong)]">{stat.value}</p>
                  <p className="mt-2 text-sm text-[var(--text-muted)]">{stat.detail}</p>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="mb-5">
          <p className="section-kicker mb-2">Catálogo</p>
          <h2 className="headline-display text-3xl text-[var(--text-strong)]">Cursos em destaque</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {spotlight.map((course, index) => (
            <div
              key={course.id}
              className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                Slot {index + 1}
              </p>
              <h3 className="mt-2 text-2xl font-bold text-[var(--text-strong)]">{course.title}</h3>
              <p className="mt-3 text-sm text-[var(--text-muted)]">{course.lessons} aulas cadastradas</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
