import { Shield, FolderCog } from "lucide-react"; // Adicione ícones para o menu admin
import { NavLink } from "react-router-dom";
import {
  Home,
  BookOpen,
  Compass,
  Award,
  Settings,
  X,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { to: "/dashboard", icon: Home, label: "Dashboard" },
  { to: "/my-courses", icon: BookOpen, label: "Meus Cursos" },
  { to: "/explore", icon: Compass, label: "Explorar" },
  { to: "/certificates", icon: Award, label: "Certificados" },
  { to: "/settings", icon: Settings, label: "Configurações" },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { isAdmin } = useAuth(); // NOVO: Trazendo a permissão do usuário
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-8 h-8 text-indigo-400" />
              <span className="text-xl font-bold">LearnHub</span>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-lg"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
            {/* --- DIVISOR DO MENU ADMIN --- */}
            {isAdmin && (
              <div className="mt-8">
                <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Administração
                </h3>
                <ul className="space-y-1">
                  <li>
                    <NavLink
                      to="/admin/dashboard"
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          isActive
                            ? "bg-indigo-50 text-indigo-700 font-medium"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`
                      }
                    >
                      <Shield className="w-5 h-5" />
                      Visão Geral
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/admin/cursos"
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          isActive
                            ? "bg-indigo-50 text-indigo-700 font-medium"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`
                      }
                    >
                      <FolderCog className="w-5 h-5" />
                      Gerenciar Cursos
                    </NavLink>
                  </li>
                </ul>
              </div>
            )}
          </nav>

          <div className="p-4 border-t border-slate-800">
            <div className="mb-3 px-2">
              <p className="text-sm text-slate-400">Logado como</p>
              <p className="text-sm font-medium text-white truncate">
                {user?.email}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-slate-300 hover:bg-red-600 hover:text-white transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sair</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
