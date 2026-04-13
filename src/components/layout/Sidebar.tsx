import { FolderCog, Moon, Sun } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Settings,
  X,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { BrandMark } from "../brand/Illustrations";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Painel" },
  { to: "/settings", icon: Settings, label: "Configurações" },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { isAdmin } = useAuth();
  const { signOut, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#030712]/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`glass-panel fixed inset-y-0 left-0 z-50 m-3 w-[18rem] rounded-[2rem] text-white transform transition-transform duration-300 ease-in-out lg:static lg:m-4 lg:h-[calc(100vh-2rem)] ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between border-b border-white/10 p-6">
            <div className="flex items-center space-x-3">
              <BrandMark />
              <div>
                <p className="text-sm font-semibold text-[var(--text-strong)]">LearnHub</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 transition-colors hover:bg-white/8 lg:hidden"
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
                  `flex items-center space-x-3 rounded-2xl px-4 py-3 transition-all duration-200 ${
                    isActive
                      ? "bg-[var(--brand-blue)] text-white"
                      : "text-[var(--text-strong)] hover:bg-[var(--bg-soft)]"
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}

            <button
              type="button"
              onClick={toggleTheme}
              className="mt-4 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-[var(--text-strong)] transition-all duration-200 hover:bg-[var(--bg-soft)]"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span className="font-medium">{theme === "dark" ? "Tema claro" : "Tema escuro"}</span>
            </button>

            {/* --- DIVISOR DO MENU ADMIN --- */}
            {isAdmin && (
              <div className="mt-8">
                <h3 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Administração
                </h3>
                <ul className="space-y-1">
                  <li>
                    <NavLink
                      to="/admin/cursos"
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          isActive
                            ? "bg-[var(--bg-soft)] text-[var(--text-strong)] font-medium"
                            : "text-[var(--text-muted)] hover:bg-[var(--bg-soft)] hover:text-[var(--text-strong)]"
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

          <div className="border-t border-white/10 p-4">
            {user && (
              <>
                <div className="mb-3 px-2">
                  <p className="text-sm text-[var(--text-muted)]">Conectado como</p>
                  <p className="truncate text-sm font-medium text-[var(--text-strong)]">
                    {user.email}
                  </p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center space-x-3 rounded-2xl px-4 py-3 text-[var(--text-strong)] transition-all duration-200 hover:bg-[var(--bg-soft)]"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Sair</span>
                </button>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
