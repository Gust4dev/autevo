"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Trash2,
  X,
  Loader2,
  FileText,
  Users,
  Camera,
  Car,
  Crown,
  DollarSign,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useClerk } from "@clerk/nextjs";

interface CancelSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats?: {
    orders?: number;
    customers?: number;
    photos?: number;
    vehicles?: number;
  };
  isFounder?: boolean;
}

export function CancelSubscriptionModal({
  isOpen,
  onClose,
  stats,
  isFounder,
}: CancelSubscriptionModalProps) {
  const router = useRouter();
  const { signOut } = useClerk();
  const [step, setStep] = useState<"warning" | "confirm">("warning");
  const [confirmationText, setConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleClose = () => {
    setStep("warning");
    setConfirmationText("");
    onClose();
  };

  const handleConfirmDelete = async () => {
    if (confirmationText !== "CANCELAR ASSINATURA") {
      toast.error('Digite exatamente "CANCELAR ASSINATURA" para confirmar');
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch("/api/stripe/cancel-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmationText }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Conta excluída com sucesso");
        // Sign out and redirect to home
        await signOut();
        router.push("/");
      } else {
        toast.error(data.error || "Erro ao cancelar assinatura");
        setIsDeleting(false);
      }
    } catch {
      toast.error("Erro ao processar cancelamento");
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        {step === "warning" ? (
          <>
            <DialogHeader>
              <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <DialogTitle className="text-center text-xl">
                Você tem certeza?
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Founder warning */}
              {isFounder && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Crown className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800">
                        Você é um Membro Fundador!
                      </p>
                      <p className="text-sm text-amber-700 mt-1">
                        Seu preço especial de{" "}
                        <strong>R$ 140/mês para sempre</strong> será perdido.
                        Vagas de fundador são limitadas e não podem ser
                        recuperadas.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* What will be lost */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="font-medium text-red-800 mb-3">
                  Ao cancelar, você perderá PERMANENTEMENTE:
                </p>
                <ul className="space-y-2 text-sm text-red-700">
                  <li className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>
                      Todos os seus{" "}
                      <strong>{stats?.orders || 0} pedidos</strong>
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>
                      Cadastro de{" "}
                      <strong>{stats?.customers || 0} clientes</strong>
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    <span>
                      Registro de{" "}
                      <strong>{stats?.vehicles || 0} veículos</strong>
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    <span>
                      Todas as <strong>{stats?.photos || 0} fotos</strong>
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span>
                      Histórico de <strong>faturamento e relatórios</strong>
                    </span>
                  </li>
                </ul>
              </div>

              {/* This action is irreversible */}
              <p className="text-center text-muted-foreground text-sm">
                Esta ação é <strong>irreversível</strong>. Depois de confirmar,
                não será possível recuperar seus dados.
              </p>

              <div className="flex gap-3">
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={handleClose}
                >
                  Voltar e Continuar Usando
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => setStep("confirm")}
                >
                  Quero Cancelar
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <Trash2 className="h-8 w-8 text-red-600" />
              </div>
              <DialogTitle className="text-center text-xl">
                Confirmação Final
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              <div className="text-center text-muted-foreground">
                <p>Para confirmar a exclusão permanente da sua conta,</p>
                <p>
                  digite{" "}
                  <strong className="text-foreground">
                    CANCELAR ASSINATURA
                  </strong>{" "}
                  abaixo:
                </p>
              </div>

              <Input
                value={confirmationText}
                onChange={(e) =>
                  setConfirmationText(e.target.value.toUpperCase())
                }
                placeholder="Digite aqui..."
                className="text-center font-mono"
                disabled={isDeleting}
              />

              <div className="flex gap-3">
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={handleClose}
                  disabled={isDeleting}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleConfirmDelete}
                  disabled={
                    confirmationText !== "CANCELAR ASSINATURA" || isDeleting
                  }
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir Conta
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
