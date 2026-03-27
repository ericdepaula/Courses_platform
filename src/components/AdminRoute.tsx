import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();

  // 1. Enquanto carrega o perfil, mostra um indicador de carregamento
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // 2. Se não estiver logado de forma alguma, manda para o Login
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // 3. Se estiver logado, mas NÃO for admin, devolve para o painel de estudante
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // 4. Se passou por tudo (é usuário E é admin), renderiza a página de administração
  return <>{children}</>;
}