import { Lock, User } from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { useAuth } from "../contexts/AuthContext";

export function Settings() {
  const { user } = useAuth();

  return (
    <Layout title="Configurações">
      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-[rgba(82,185,234,0.14)]">
                <User className="h-5 w-5 text-[var(--brand-blue)]" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[var(--text-strong)]">Perfil</h3>
                <p className="text-sm text-[var(--text-muted)]">Dados básicos da sua conta.</p>
              </div>
            </div>
            <div className="space-y-4">
              <Input label="Email" type="email" value={user?.email || ""} disabled />
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Nome" type="text" placeholder="Seu nome" />
                <Input label="Sobrenome" type="text" placeholder="Seu sobrenome" />
              </div>
              <Button>Salvar alterações</Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-[rgba(88,199,177,0.14)]">
                <Lock className="h-5 w-5 text-[var(--brand-teal)]" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[var(--text-strong)]">Segurança</h3>
                <p className="text-sm text-[var(--text-muted)]">Atualize sua senha quando precisar.</p>
              </div>
            </div>
            <div className="space-y-4">
              <Input label="Senha atual" type="password" placeholder="Digite a senha atual" />
              <Input label="Nova senha" type="password" placeholder="Defina uma nova senha" />
              <Input label="Confirmar nova senha" type="password" placeholder="Repita a nova senha" />
              <Button>Atualizar senha</Button>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
