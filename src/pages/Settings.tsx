import { useState } from 'react';
import { User, Bell, Lock, Palette } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';

export function Settings() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(false);

  return (
    <Layout title="Configurações">
      <div className="max-w-4xl space-y-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Perfil</h2>
              <p className="text-sm text-slate-600">
                Gerencie suas informações pessoais
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={user?.email || ''}
              disabled
            />
            <div className="flex gap-4">
              <Input label="Nome" type="text" placeholder="Seu nome" />
              <Input label="Sobrenome" type="text" placeholder="Seu sobrenome" />
            </div>
            <Button>Salvar Alterações</Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Notificações</h2>
              <p className="text-sm text-slate-600">
                Configure suas preferências de notificação
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium text-slate-900">
                  Notificações push
                </p>
                <p className="text-sm text-slate-600">
                  Receba notificações sobre novos cursos
                </p>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  notifications ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    notifications ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium text-slate-900">
                  Atualizações por email
                </p>
                <p className="text-sm text-slate-600">
                  Receba novidades por email
                </p>
              </div>
              <button
                onClick={() => setEmailUpdates(!emailUpdates)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  emailUpdates ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    emailUpdates ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Lock className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Segurança</h2>
              <p className="text-sm text-slate-600">
                Altere sua senha e configure a segurança
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <Input
              label="Senha Atual"
              type="password"
              placeholder="••••••••"
            />
            <Input label="Nova Senha" type="password" placeholder="••••••••" />
            <Input
              label="Confirmar Nova Senha"
              type="password"
              placeholder="••••••••"
            />
            <Button>Alterar Senha</Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Palette className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Aparência</h2>
              <p className="text-sm text-slate-600">
                Personalize a aparência da plataforma
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <button className="p-4 border-2 border-indigo-600 rounded-lg bg-white hover:bg-slate-50 transition-colors">
              <div className="w-full h-20 bg-white border border-slate-200 rounded mb-2"></div>
              <p className="text-sm font-medium text-slate-900">Claro</p>
            </button>
            <button className="p-4 border-2 border-transparent rounded-lg bg-white hover:bg-slate-50 transition-colors">
              <div className="w-full h-20 bg-slate-900 rounded mb-2"></div>
              <p className="text-sm font-medium text-slate-900">Escuro</p>
            </button>
            <button className="p-4 border-2 border-transparent rounded-lg bg-white hover:bg-slate-50 transition-colors">
              <div className="w-full h-20 bg-gradient-to-br from-white to-slate-900 rounded mb-2"></div>
              <p className="text-sm font-medium text-slate-900">Auto</p>
            </button>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
