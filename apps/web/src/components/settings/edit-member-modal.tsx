"use client";

import { useState, useEffect } from "react";
import {
  Pencil,
  Loader2,
  DollarSign,
  Percent,
  Key,
  Calendar,
  Briefcase,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Button,
} from "@/components/ui";
import { trpc } from "@/lib/trpc/provider";
import { toast } from "sonner";
import { format } from "date-fns";

interface User {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "MANAGER" | "MEMBER";
  jobTitle?: string | null;
  salary?: number | null;
  defaultCommissionPercent?: number | null;
  pixKey?: string | null;
  admissionDate?: Date | string | null;
  isActive: boolean;
}

interface EditMemberModalProps {
  user: User;
  onSuccess?: () => void;
}

export function EditMemberModal({ user, onSuccess }: EditMemberModalProps) {
  const [open, setOpen] = useState(false);
  const utils = trpc.useUtils();

  const [name, setName] = useState("");
  const [role, setRole] = useState<"OWNER" | "MANAGER" | "MEMBER">("MEMBER");
  const [jobTitle, setJobTitle] = useState("");
  const [salary, setSalary] = useState("");
  const [commission, setCommission] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [admissionDate, setAdmissionDate] = useState("");

  // Sync state when modal opens
  useEffect(() => {
    if (open) {
      setName(user.name);
      setRole(user.role);
      setJobTitle(user.jobTitle ?? "");
      setSalary(user.salary != null ? String(user.salary) : "");
      setCommission(
        user.defaultCommissionPercent != null
          ? String(user.defaultCommissionPercent)
          : "",
      );
      setPixKey(user.pixKey ?? "");
      setAdmissionDate(
        user.admissionDate
          ? format(new Date(user.admissionDate), "yyyy-MM-dd")
          : "",
      );
    }
  }, [open, user]);

  const updateMutation = trpc.user.update.useMutation({
    onSuccess: () => {
      toast.success("Funcionário atualizado com sucesso!");
      utils.user.list.invalidate();
      setOpen(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar funcionário");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || name.trim().length < 2) {
      toast.error("Nome deve ter pelo menos 2 caracteres");
      return;
    }

    const salaryNum = salary !== "" ? parseFloat(salary) : undefined;
    const commissionNum =
      commission !== "" ? parseFloat(commission) : undefined;

    if (salaryNum !== undefined && (isNaN(salaryNum) || salaryNum < 0)) {
      toast.error("Salário inválido");
      return;
    }
    if (
      commissionNum !== undefined &&
      (isNaN(commissionNum) || commissionNum < 0 || commissionNum > 100)
    ) {
      toast.error("Comissão deve ser entre 0 e 100");
      return;
    }

    updateMutation.mutate({
      id: user.id,
      data: {
        name: name.trim(),
        role,
        jobTitle: jobTitle.trim() || undefined,
        salary: salaryNum,
        defaultCommissionPercent: commissionNum,
        pixKey: pixKey.trim() || undefined,
        admissionDate: admissionDate ? new Date(admissionDate) : undefined,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Funcionário</DialogTitle>
          <DialogDescription className="font-medium text-foreground/80">
            {user.email}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nome completo</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Nome do funcionário"
              required
              minLength={2}
            />
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Cargo no sistema</label>
            {user.role === "OWNER" ? (
              <p className="text-sm text-muted-foreground px-3 py-2 border rounded-md bg-muted/30">
                Dono — cargo não pode ser alterado
              </p>
            ) : (
              <select
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as "MANAGER" | "MEMBER")
                }
                className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="MEMBER">Membro (Técnico)</option>
                <option value="MANAGER">Gerente</option>
              </select>
            )}
          </div>

          {/* Job Title */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
              Título do cargo
            </label>
            <input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Ex: Polidor, Funileiro, Pintor..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Salary */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                Salário (R$)
              </label>
              <input
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                type="number"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="0,00"
              />
            </div>

            {/* Commission */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                Comissão (%)
              </label>
              <input
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                type="number"
                step="0.1"
                min="0"
                max="100"
                className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="0"
              />
            </div>
          </div>

          {/* PIX Key */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5 text-muted-foreground" />
              Chave PIX
            </label>
            <input
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="CPF, email, telefone ou chave aleatória"
            />
          </div>

          {/* Admission Date */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              Data de admissão
            </label>
            <input
              value={admissionDate}
              onChange={(e) => setAdmissionDate(e.target.value)}
              type="date"
              className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar alterações"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
