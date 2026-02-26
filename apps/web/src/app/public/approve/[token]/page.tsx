"use client";

import { use, useState, useEffect } from "react";
import { trpc } from "@/lib/trpc/provider";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ShieldCheck,
  FileText,
} from "lucide-react";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default function ApproveOrderPage({ params }: PageProps) {
  const { token } = use(params);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [result, setResult] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        setOrderId(payload.orderId);
      }
    } catch {
      /* invalid token handled by mutation */
    }
  }, [token]);

  const { data, isLoading, error } = trpc.order.getPublicStatus.useQuery(
    { orderId: orderId! },
    { enabled: !!orderId },
  );

  const approveMutation = trpc.order.approveOrder.useMutation({
    onSuccess: (res) => {
      setResult(res.action as "APPROVED" | "REJECTED");
      toast.success(
        res.action === "APPROVED"
          ? "Orçamento aprovado com sucesso!"
          : "Orçamento recusado.",
      );
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleAction = (action: "APPROVE" | "REJECT") => {
    if (action === "APPROVE" && !termsAccepted) {
      toast.error("Aceite os termos para aprovar o orçamento");
      return;
    }
    approveMutation.mutate({ token, action, termsAccepted });
  };

  if (result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900 p-6">
        <div className="text-center max-w-md space-y-4">
          {result === "APPROVED" ? (
            <>
              <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
              <h1 className="text-2xl font-bold">Orçamento Aprovado!</h1>
              <p className="text-muted-foreground">
                Sua aprovação foi registrada com sucesso. A oficina receberá uma
                notificação e iniciará os trabalhos conforme agendado.
              </p>
            </>
          ) : (
            <>
              <XCircle className="mx-auto h-16 w-16 text-red-500" />
              <h1 className="text-2xl font-bold">Orçamento Recusado</h1>
              <p className="text-muted-foreground">
                Sua decisão foi registrada. Entre em contato com a oficina caso
                deseje negociar os valores.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <XCircle className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="text-xl font-bold">Link inválido ou expirado</h1>
          <p className="text-muted-foreground">
            Solicite um novo link à oficina.
          </p>
        </div>
      </div>
    );
  }

  const primaryColor = data.tenantContact.primaryColor || "#DC2626";

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      {/* Header */}
      <div
        className="py-6 px-6 text-white text-center"
        style={{ backgroundColor: primaryColor }}
      >
        {data.tenantContact.logo && (
          <img
            src={data.tenantContact.logo}
            alt={data.tenantContact.name}
            className="h-12 mx-auto mb-2 object-contain"
          />
        )}
        <h1 className="text-xl font-bold">{data.tenantContact.name}</h1>
        <p className="text-sm opacity-80">Orçamento de Serviço</p>
      </div>

      <div className="max-w-lg mx-auto p-6 space-y-6">
        {/* Vehicle Info */}
        <div className="bg-white dark:bg-zinc-800 rounded-xl p-4 shadow-sm border space-y-1">
          <p className="text-sm text-muted-foreground">Veículo</p>
          <p className="font-semibold">{data.vehicleName}</p>
          {data.vehiclePlate && (
            <p className="text-sm text-muted-foreground">
              Placa: {data.vehiclePlate}
            </p>
          )}
        </div>

        {/* Services */}
        <div className="bg-white dark:bg-zinc-800 rounded-xl p-4 shadow-sm border space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" /> Serviços
          </h2>
          {data.services.map((s, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span>{s.name}</span>
              <span className="font-medium">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(s.total)}
              </span>
            </div>
          ))}
          <div className="border-t pt-2 flex justify-between font-bold">
            <span>Total</span>
            <span style={{ color: primaryColor }}>
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(data.total)}
            </span>
          </div>
        </div>

        {/* Terms */}
        <div className="bg-white dark:bg-zinc-800 rounded-xl p-4 shadow-sm border space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" /> Termos de Serviço
          </h2>
          <div className="text-xs text-muted-foreground max-h-32 overflow-y-auto leading-relaxed">
            Ao aprovar este orçamento, declaro que estou ciente dos serviços a
            serem realizados e seus respectivos valores. Autorizo a execução dos
            serviços descritos acima no veículo informado. Eventuais serviços
            adicionais identificados durante a execução serão comunicados e
            autorizados antes de sua realização. O pagamento deverá ser efetuado
            conforme condições acordadas com o estabelecimento.
          </div>

          <label className="flex items-start gap-3 cursor-pointer p-3 border rounded-lg hover:bg-muted/50 transition-colors">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded"
            />
            <span className="text-sm">
              Li e aceito os termos e condições acima. Autorizo a execução dos
              serviços descritos.
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => handleAction("REJECT")}
            disabled={approveMutation.isPending}
            className="flex-1 py-3 px-4 rounded-xl border-2 border-red-200 text-red-600 font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            Recusar
          </button>
          <button
            onClick={() => handleAction("APPROVE")}
            disabled={approveMutation.isPending || !termsAccepted}
            className="flex-1 py-3 px-4 rounded-xl text-white font-semibold transition-all disabled:opacity-50"
            style={{
              backgroundColor: termsAccepted ? primaryColor : "#9ca3af",
            }}
          >
            {approveMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin mx-auto" />
            ) : (
              "Aprovar Orçamento"
            )}
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Powered by Autevo — Sistema de Gestão para Oficinas
        </p>
      </div>
    </div>
  );
}
