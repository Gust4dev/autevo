"use client";

import { usePushNotifications } from "@/hooks/use-push-notifications";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, BellOff, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export function PushNotificationToggle() {
  const {
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    isSupported,
  } = usePushNotifications();

  if (!isSupported) {
    return (
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <BellOff className="w-4 h-4" />
        <span>Notificações push não são suportadas neste navegador</span>
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="flex items-start gap-3 text-sm">
        <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
        <div>
          <p className="font-medium text-destructive">
            Notificações bloqueadas
          </p>
          <p className="text-muted-foreground text-xs mt-1">
            Você bloqueou as notificações. Para reativar, acesse as
            configurações do seu navegador e permita notificações para este
            site.
          </p>
        </div>
      </div>
    );
  }

  const handleToggle = async () => {
    if (isLoading) return;

    if (isSubscribed) {
      const success = await unsubscribe();
      if (success) {
        toast.success("Notificações desativadas");
      } else {
        toast.error("Erro ao desativar notificações");
      }
    } else {
      const success = await subscribe();
      if (success) {
        toast.success(
          "Notificações ativadas! Você receberá alertas sobre novas OS e atualizações.",
        );
      } else {
        toast.error(
          "Não foi possível ativar as notificações. Verifique as permissões do navegador.",
        );
      }
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Bell className="w-4 h-4 text-muted-foreground" />
        <div>
          <Label htmlFor="push-toggle" className="font-medium cursor-pointer">
            Receber notificações push
          </Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Alertas sobre novas OS, status e atribuições
          </p>
        </div>
      </div>

      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      ) : (
        <Switch
          id="push-toggle"
          checked={isSubscribed}
          onCheckedChange={handleToggle}
          disabled={isLoading}
        />
      )}
    </div>
  );
}
