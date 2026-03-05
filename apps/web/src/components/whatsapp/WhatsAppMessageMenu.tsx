"use client";

import { useState } from "react";
import {
  MessageCircle,
  AlertTriangle,
  Send,
  Gift,
  FileText,
  Sparkles,
} from "lucide-react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import {
  DEFAULT_TEMPLATES,
  replaceTemplateVariables,
  openWhatsApp,
  getTrackingUrl,
} from "@/lib/whatsapp";
import { trpc } from "@/lib/trpc/provider";

interface WhatsAppMessageMenuProps {
  customer: {
    name: string;
    phone: string;
    whatsappOptIn?: boolean;
  };
  context?: "customer" | "order";
  orderId?: string;
  vehicleName?: string;
  trackingUrl?: string; // 🛡️ URL completo e seguro de tracking (com token hmac)
}

const TEMPLATE_ICONS: Record<string, React.ReactNode> = {
  tracking_link: <Send className="mr-2 h-4 w-4" />,
  service_completed: <Sparkles className="mr-2 h-4 w-4" />,
  payment_reminder: <FileText className="mr-2 h-4 w-4" />,
  birthday: <Gift className="mr-2 h-4 w-4" />,
  generic: <MessageCircle className="mr-2 h-4 w-4" />,
};

export function WhatsAppMessageMenu({
  customer,
  context = "customer",
  orderId,
  vehicleName,
  trackingUrl,
}: WhatsAppMessageMenuProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  const { data: settings } = trpc.settings.get.useQuery();
  const tenantName = settings?.name || "Nossa Empresa";

  const handleSendMessage = (templateKey: string) => {
    const template = DEFAULT_TEMPLATES.find((t) => t.key === templateKey);
    if (!template) return;

    const variables: Record<string, string> = {
      nome: customer.name.split(" ")[0],
      empresa: tenantName,
    };

    if (vehicleName) {
      variables.veiculo = vehicleName;
    }

    if (orderId && templateKey === "tracking_link") {
      variables.link = trackingUrl || getTrackingUrl(orderId);
    }

    const message = replaceTemplateVariables(template.message, variables);

    if (!customer.whatsappOptIn) {
      setPendingMessage(message);
      setShowWarning(true);
      return;
    }

    openWhatsApp(customer.phone, message);
  };

  const handleContinue = () => {
    if (pendingMessage) {
      openWhatsApp(customer.phone, pendingMessage);
    }
    setShowWarning(false);
    setPendingMessage(null);
  };

  const filteredTemplates = DEFAULT_TEMPLATES.filter((t) => {
    if (context === "customer") {
      return t.key !== "tracking_link" && t.key !== "service_completed";
    }
    return true;
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={!customer.phone}
          >
            <MessageCircle className="h-4 w-4 text-green-600" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {filteredTemplates.map((template, index) => (
            <div key={template.key}>
              {index > 0 && template.key === "generic" && (
                <DropdownMenuSeparator />
              )}
              <DropdownMenuItem onClick={() => handleSendMessage(template.key)}>
                {TEMPLATE_ICONS[template.key]}
                {template.name}
              </DropdownMenuItem>
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Cliente não optou por receber mensagens
            </DialogTitle>
            <DialogDescription>
              Este cliente não autorizou o recebimento de mensagens via
              WhatsApp. Deseja continuar mesmo assim?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWarning(false)}>
              Cancelar
            </Button>
            <Button onClick={handleContinue}>Continuar mesmo assim</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
