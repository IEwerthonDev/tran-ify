import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useGetMyTenant, useUpdateMyTenant } from "@workspace/api-client-react";
import { useChangePassword } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Save, KeyRound, Store, ExternalLink } from "lucide-react";

export default function ConfiguracoesPage() {
  const { data: tenant, isLoading } = useGetMyTenant();
  const updateMutation = useUpdateMyTenant();
  const changePasswordMutation = useChangePassword();
  const { toast } = useToast();

  const [profile, setProfile] = useState({
    name: "",
    whatsapp: "",
    logoUrl: "",
    primaryColor: "#6D1F3A",
  });

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (tenant) {
      setProfile({
        name: tenant.name ?? "",
        whatsapp: tenant.whatsapp ?? "",
        logoUrl: tenant.logoUrl ?? "",
        primaryColor: tenant.primaryColor ?? "#6D1F3A",
      });
    }
  }, [tenant]);

  const handleSaveProfile = async () => {
    try {
      await updateMutation.mutateAsync({
        data: {
          name: profile.name,
          whatsapp: profile.whatsapp || undefined,
          logoUrl: profile.logoUrl || undefined,
          primaryColor: profile.primaryColor,
        },
      });
      toast({ title: "Perfil atualizado com sucesso!" });
    } catch {
      toast({ title: "Erro ao salvar perfil", variant: "destructive" });
    }
  };

  const handleChangePassword = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast({ title: "As senhas não coincidem", variant: "destructive" });
      return;
    }
    if (passwords.newPassword.length < 6) {
      toast({ title: "Nova senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }
    try {
      await changePasswordMutation.mutateAsync({
        data: {
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        },
      });
      toast({ title: "Senha alterada com sucesso!" });
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch {
      toast({ title: "Erro ao alterar senha. Verifique a senha atual.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          {[1, 2].map((i) => <div key={i} className="h-64 bg-card rounded-3xl border border-border/50 animate-pulse" />)}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-10">
        <h1 className="text-4xl font-display font-bold text-foreground">Configurações do Salão</h1>
        <p className="text-muted-foreground mt-2 text-lg">Personalize seu perfil e informações de contato.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">

          {/* Profile Card */}
          <div className="bg-card p-8 rounded-[2rem] border border-border/50 shadow-xl shadow-black/5">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-primary/10 rounded-xl text-primary">
                <Store className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-display font-bold">Perfil do Salão</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Field label="Nome do Salão">
                  <Input
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder="Ex: Salão da Naíra"
                    className="h-12 text-base"
                  />
                </Field>
              </div>

              <Field label="WhatsApp (com DDI)">
                <Input
                  value={profile.whatsapp}
                  onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })}
                  placeholder="5511999887766"
                  className="h-12"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Usado para receber notificações de novos agendamentos.
                </p>
              </Field>

              <Field label="Cor Principal">
                <div className="flex gap-3 items-center h-12">
                  <input
                    type="color"
                    value={profile.primaryColor}
                    onChange={(e) => setProfile({ ...profile, primaryColor: e.target.value })}
                    className="w-12 h-12 rounded-xl border border-input cursor-pointer p-0.5"
                  />
                  <Input
                    value={profile.primaryColor}
                    onChange={(e) => setProfile({ ...profile, primaryColor: e.target.value })}
                    placeholder="#6D1F3A"
                    className="flex-1 h-12 font-mono"
                  />
                </div>
              </Field>

              <div className="md:col-span-2">
                <Field label="URL da Logo">
                  <Input
                    value={profile.logoUrl}
                    onChange={(e) => setProfile({ ...profile, logoUrl: e.target.value })}
                    placeholder="https://exemplo.com/logo.png"
                    className="h-12"
                  />
                </Field>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-4">
              <Button
                size="lg"
                className="px-8 h-12 rounded-xl"
                onClick={handleSaveProfile}
                disabled={updateMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {updateMutation.isPending ? "Salvando..." : "Salvar Perfil"}
              </Button>
              {tenant?.slug && (
                <a
                  href={`/${tenant.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary font-semibold hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ver página de agendamento
                </a>
              )}
            </div>
          </div>

          {/* Change Password Card */}
          <div className="bg-card p-8 rounded-[2rem] border border-border/50 shadow-xl shadow-black/5">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-amber-100 rounded-xl text-amber-600">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-display font-bold">Alterar Senha</h2>
            </div>

            <div className="space-y-5 max-w-md">
              <Field label="Senha atual">
                <Input
                  type="password"
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                  placeholder="••••••••"
                  className="h-12"
                />
              </Field>
              <Field label="Nova senha">
                <Input
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  className="h-12"
                />
              </Field>
              <Field label="Confirmar nova senha">
                <Input
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                  placeholder="Repita a nova senha"
                  className="h-12"
                />
              </Field>
              <Button
                size="lg"
                className="px-8 h-12 rounded-xl bg-amber-600 hover:bg-amber-700"
                onClick={handleChangePassword}
                disabled={changePasswordMutation.isPending}
              >
                {changePasswordMutation.isPending ? "Alterando..." : "Alterar Senha"}
              </Button>
            </div>
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <div className="bg-secondary/50 rounded-[2rem] p-8 border border-border">
            <h3 className="text-xl font-display font-bold mb-4">Sua Página Pública</h3>
            {tenant?.slug && (
              <>
                <div className="bg-background border border-border rounded-xl p-4 mb-4 font-mono text-sm text-primary break-all">
                  trancify.app/<strong>{tenant.slug}</strong>
                </div>
                <p className="text-sm text-muted-foreground">
                  Compartilhe este link com suas clientes para que elas possam agendar diretamente.
                </p>
              </>
            )}
          </div>

          <div className="bg-primary/5 rounded-[2rem] p-8 border border-primary/20">
            <h3 className="text-xl font-display font-bold mb-4 text-primary">Notificações WhatsApp</h3>
            <p className="text-sm text-muted-foreground">
              Quando o WhatsApp estiver configurado, você receberá uma mensagem automática com os dados do cliente e as fotos de referência sempre que um novo agendamento for feito.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-semibold mb-1.5 block text-foreground">{label}</label>
      {children}
    </div>
  );
}
