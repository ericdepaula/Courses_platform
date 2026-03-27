import { BookOpen, Users, DollarSign, TrendingUp } from 'lucide-react';

export function AdminDashboard() {
  const stats = [
    { title: 'Total de Alunos', value: '156', icon: Users, color: 'bg-blue-500' },
    { title: 'Cursos Ativos', value: '12', icon: BookOpen, color: 'bg-indigo-500' },
    { title: 'Receita Mensal', value: 'R$ 4.500', icon: DollarSign, color: 'bg-green-500' },
    { title: 'Taxa de Conclusão', value: '68%', icon: TrendingUp, color: 'bg-purple-500' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Visão Geral da Plataforma</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center gap-4">
                <div className={`${stat.color} p-3 rounded-lg text-white`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Atividade Recente</h2>
        <p className="text-gray-500 text-sm">
          A integração com os logs de atividade será implementada aqui.
        </p>
      </div>
    </div>
  );
}   