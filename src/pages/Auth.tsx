import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useAuth } from "../contexts/AuthContext";
import { BrandMark } from "../components/brand/Illustrations";

function SubjectsPreview() {
  return (
    <svg viewBox="0 0 220 120" className="w-full" fill="none" aria-hidden="true">
      <rect x="10" y="14" width="200" height="92" rx="22" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" />
      <rect x="24" y="28" width="82" height="64" rx="16" fill="rgba(82,185,234,0.16)" />
      <rect x="118" y="28" width="78" height="16" rx="8" fill="rgba(255,255,255,0.12)" />
      <rect x="118" y="52" width="62" height="12" rx="6" fill="rgba(255,255,255,0.08)" />
      <rect x="118" y="72" width="70" height="12" rx="6" fill="rgba(200,164,106,0.3)" />
      <path d="M46 48H84" stroke="#52B9EA" strokeWidth="8" strokeLinecap="round" />
      <path d="M46 64H76" stroke="#52B9EA" strokeWidth="8" strokeLinecap="round" />
      <path d="M46 80H68" stroke="#52B9EA" strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
}

function ProgressPreview() {
  return (
    <svg viewBox="0 0 220 120" className="w-full" fill="none" aria-hidden="true">
      <rect x="10" y="14" width="200" height="92" rx="22" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" />
      <circle cx="60" cy="60" r="24" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
      <path d="M60 36A24 24 0 1 1 39.2 72" stroke="#52B9EA" strokeWidth="10" strokeLinecap="round" />
      <rect x="106" y="36" width="82" height="14" rx="7" fill="rgba(255,255,255,0.12)" />
      <rect x="106" y="58" width="64" height="10" rx="5" fill="rgba(82,185,234,0.18)" />
      <rect x="106" y="76" width="74" height="10" rx="5" fill="rgba(255,255,255,0.08)" />
    </svg>
  );
}

export function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocorreu um erro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-6 lg:px-8 lg:py-8">
      <div className="absolute inset-0 ambient-grid opacity-30" />
      <div className="relative mx-auto flex min-h-[calc(100vh-2rem)] max-w-5xl items-center justify-center">
        <Card className="w-full overflow-hidden p-3 lg:p-4">
          <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="relative overflow-hidden rounded-[2rem] border border-[var(--stroke-soft)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-8 lg:p-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(200,164,106,0.22),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(82,185,234,0.16),transparent_34%)]" />
              <div className="relative">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-white/10">
                    <BrandMark className="h-10 w-10" />
                  </div>
                  <div>
                    <p className="section-kicker mb-2">Acesso</p>
                    <h1 className="headline-display text-4xl text-[var(--text-strong)] lg:text-5xl">LearnHub</h1>
                  </div>
                </div>

                <p className="mt-10 max-w-lg text-base leading-8 text-[var(--text-muted)]">
                  Acesse a plataforma para entrar nas matérias liberadas da sua conta.
                </p>

                <div className="mt-10 grid gap-3 sm:grid-cols-2">
                  <div className="glass-soft rounded-[1.5rem] p-4">
                    <div className="mb-4">
                      <SubjectsPreview />
                    </div>
                    <p className="font-semibold text-[var(--text-strong)]">Matérias liberadas</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                      Entre direto no curso e escolha a matéria que deseja abrir.
                    </p>
                  </div>
                  <div className="glass-soft rounded-[1.5rem] p-4">
                    <div className="mb-4">
                      <ProgressPreview />
                    </div>
                    <p className="font-semibold text-[var(--text-strong)]">Progresso salvo</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                      Continue do ponto em que parou e acompanhe o andamento das aulas.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <div className="mx-auto w-full max-w-md px-3 py-6 lg:px-6">
                <div className="mb-8">
                  <p className="section-kicker mb-3">{isLogin ? "Entrar" : "Criar acesso"}</p>
                  <h2 className="headline-display text-4xl text-[var(--text-strong)]">
                    {isLogin ? "Acesse sua conta." : "Crie sua conta."}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
                    {isLogin
                      ? "Use seu email e senha para continuar de onde parou."
                      : "Preencha os dados abaixo para começar a usar a plataforma."}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    type="email"
                    label="Email"
                    placeholder="voce@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />

                  <Input
                    type="password"
                    label="Senha"
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />

                  {error && (
                    <div className="rounded-[1.25rem] border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">
                      {error}
                    </div>
                  )}

                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? "Carregando..." : isLogin ? "Entrar na plataforma" : "Criar conta"}
                    {!loading && <ArrowRight className="h-4 w-4" />}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-sm font-semibold text-[var(--brand-blue)] transition-colors hover:text-[#7fd1f6]"
                  >
                    {isLogin ? "Ainda não tem conta? Criar agora" : "Já tem conta? Fazer login"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
