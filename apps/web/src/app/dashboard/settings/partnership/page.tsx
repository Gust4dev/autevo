"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Lexend_Deca } from "next/font/google";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/cn";
import {
  Handshake,
  Copy,
  Check,
  Users,
  TrendingUp,
  Gift,
  Sparkles,
  Calculator,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Wallet,
  Crown,
  ArrowRight,
  Info,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const lexendDeca = Lexend_Deca({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const MONTHLY_PRICE = 140;
const COMMISSION_PERCENT = 30;
const COMMISSION_AMOUNT = (MONTHLY_PRICE * COMMISSION_PERCENT) / 100;

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function CalculatorSection() {
  const tiers = [
    { clients: 1, monthly: COMMISSION_AMOUNT, special: false },
    { clients: 2, monthly: COMMISSION_AMOUNT * 2, special: false },
    { clients: 3, monthly: COMMISSION_AMOUNT * 3, special: false },
    { clients: 5, monthly: COMMISSION_AMOUNT * 5, special: true },
    { clients: 10, monthly: COMMISSION_AMOUNT * 10, special: false },
    { clients: 20, monthly: COMMISSION_AMOUNT * 20, special: false },
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-emerald-500/10">
          <Calculator className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Calculadora de Ganhos</h2>
          <p className="text-sm text-muted-foreground">
            Veja quanto você pode ganhar indicando empresas
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Clientes</TableHead>
              <TableHead className="text-right">Mensal</TableHead>
              <TableHead className="text-right">Anual</TableHead>
              <TableHead>Benefício</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tiers.map((tier) => (
              <TableRow
                key={tier.clients}
                className={
                  tier.special ? "bg-amber-50/50 dark:bg-amber-950/20" : ""
                }
              >
                <TableCell className="font-medium">
                  {tier.clients} {tier.clients === 1 ? "cliente" : "clientes"}
                </TableCell>
                <TableCell className="text-right font-semibold text-emerald-600">
                  {formatCurrency(tier.monthly)}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(tier.monthly * 12)}
                </TableCell>
                <TableCell>
                  {tier.special && (
                    <Badge className="bg-amber-500 text-amber-950">
                      <Crown className="h-3 w-3 mr-1" />
                      Mensalidade Grátis!
                    </Badge>
                  )}
                  {tier.clients >= 5 && !tier.special && (
                    <span className="text-sm text-emerald-600">
                      + {formatCurrency(MONTHLY_PRICE * 12)}/ano economizado
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 p-4 rounded-lg bg-muted/50">
        <p className="text-sm text-muted-foreground">
          <strong>Como funciona:</strong> Você recebe{" "}
          <span className="font-semibold text-emerald-600">
            {COMMISSION_PERCENT}% ({formatCurrency(COMMISSION_AMOUNT)})
          </span>{" "}
          de cada mensalidade paga pelos clientes que você indicar. O pagamento
          é feito via <strong>PIX</strong> mensalmente.
        </p>
      </div>
    </Card>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      icon: Handshake,
      title: "Indique",
      description: "Compartilhe seu código único com outras empresas",
    },
    {
      icon: Users,
      title: "Eles assinam",
      description: "O cliente usa seu código no momento da compra",
    },
    {
      icon: Clock,
      title: "1º mês de carência",
      description: "A comissão começa a contar após o primeiro mês pago",
    },
    {
      icon: Wallet,
      title: "Receba via PIX",
      description: `${COMMISSION_PERCENT}% (${formatCurrency(COMMISSION_AMOUNT)}) por cliente ativo`,
    },
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-primary/10">
          <Info className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Como Funciona o Programa</h2>
          <p className="text-sm text-muted-foreground">
            Ganhe dinheiro indicando o Autevo para outras empresas
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((step, index) => (
          <div
            key={index}
            className="flex flex-col items-center text-center p-4 rounded-xl bg-muted/30"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <step.icon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-1">{step.title}</h3>
            <p className="text-sm text-muted-foreground">{step.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-200">
              Importante: Regra do 1º Mês
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              A primeira comissão só é paga a partir do{" "}
              <strong>segundo mês</strong> do cliente indicado. Isso garante que
              apenas clientes reais e comprometidos gerem comissão.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

function PartnerCodeSection() {
  const [customCode, setCustomCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: suggestion, isLoading: isLoadingSuggestion } =
    trpc.partnership.suggestPartnerCode.useQuery();
  const generateMutation = trpc.partnership.generatePartnerCode.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (suggestion?.suggestion && !suggestion.hasCode) {
      setCustomCode(suggestion.suggestion);
    }
  }, [suggestion]);

  const handleGenerate = async () => {
    if (!customCode.trim()) {
      toast.error("Digite um código");
      return;
    }

    const formattedCode = customCode.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (formattedCode.length < 3) {
      toast.error("Código deve ter pelo menos 3 caracteres");
      return;
    }

    setIsGenerating(true);
    try {
      await generateMutation.mutateAsync({ code: formattedCode });
      toast.success("Código de parceiro criado com sucesso!");
      utils.partnership.getPartnerStats.invalidate();
      utils.partnership.suggestPartnerCode.invalidate();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar código");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (suggestion?.hasCode && suggestion.suggestion) {
      navigator.clipboard.writeText(suggestion.suggestion);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Código copiado!");
    }
  };

  if (isLoadingSuggestion) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  if (suggestion?.hasCode) {
    return (
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Seu Código de Parceiro</h2>
            <p className="text-sm text-muted-foreground">
              Compartilhe com empresas para ganhar comissões
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 p-4 rounded-xl bg-card border-2 border-primary/30">
            <p className="text-2xl font-bold tracking-wider text-center">
              {suggestion.suggestion}
            </p>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleCopy}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copiar código</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <p className="text-sm text-muted-foreground mt-4 text-center">
          Quando uma empresa usar este código, você receberá{" "}
          <strong className="text-emerald-600">
            {formatCurrency(COMMISSION_AMOUNT)}
          </strong>{" "}
          por mês enquanto ela for assinante.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-primary/10">
          <Handshake className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Criar Código de Parceiro</h2>
          <p className="text-sm text-muted-foreground">
            Escolha um código único baseado no nome da sua empresa
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="partnerCode">Seu código de parceiro</Label>
          <div className="flex gap-2 mt-1.5">
            <Input
              id="partnerCode"
              value={customCode}
              onChange={(e) =>
                setCustomCode(
                  e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
                )
              }
              placeholder="Ex: FILMTECH"
              className="font-mono text-lg tracking-wider uppercase"
              maxLength={20}
            />
            <Button onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Criar"
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            Apenas letras maiúsculas e números. Mínimo 3 caracteres.
          </p>
        </div>
      </div>
    </Card>
  );
}

function ReferredTenantsSection() {
  const { data: referrals, isLoading } =
    trpc.partnership.getReferredTenants.useQuery();

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  if (!referrals || referrals.length === 0) {
    return null;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-indigo-500/10">
          <Users className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Empresas Indicadas</h2>
          <p className="text-sm text-muted-foreground">
            Acompanhe o status das suas indicações
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Desde</TableHead>
              <TableHead className="text-right">Comissão Mensal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {referrals.map((referral) => (
              <TableRow key={referral.id}>
                <TableCell className="font-medium">
                  {referral.tenantName}
                </TableCell>
                <TableCell>
                  {referral.status === "ACTIVE" ? (
                    referral.isEligibleForCommission ? (
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Gerando comissão
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        Aguardando 1º mês
                      </Badge>
                    )
                  ) : referral.status === "PENDING" ? (
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      Aguardando pagamento
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      Cancelado
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(referral.createdAt), "dd/MM/yyyy", {
                    locale: ptBR,
                  })}
                </TableCell>
                <TableCell className="text-right">
                  {referral.isEligibleForCommission ? (
                    <span className="font-semibold text-emerald-600">
                      {formatCurrency(referral.estimatedMonthlyCommission)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

function StatsSection() {
  const { data: stats, isLoading } =
    trpc.partnership.getPartnerStats.useQuery();

  if (isLoading || !stats) {
    return null;
  }

  if (stats.totalReferrals === 0 && !stats.partnerCode) {
    return null;
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10">
            <Users className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Indicados</p>
            <p className="text-2xl font-bold">{stats.totalReferrals}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Gerando Comissão</p>
            <p className="text-2xl font-bold">{stats.eligibleForCommission}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Receita Mensal</p>
            <p className="text-2xl font-bold text-emerald-600">
              {formatCurrency(stats.monthlyRevenue)}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <DollarSign className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Comissão Pendente</p>
            <p className="text-2xl font-bold text-amber-600">
              {formatCurrency(stats.pendingCommissionAmount)}
            </p>
          </div>
        </div>
      </Card>

      {stats.hasFreeTier && (
        <Card className="sm:col-span-2 lg:col-span-4 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <Crown className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-amber-800 dark:text-amber-200">
                🎉 Parabéns! Você tem mensalidade GRÁTIS!
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Com 5+ clientes ativos, você economiza{" "}
                <strong>{formatCurrency(stats.annualSavings)}</strong> por ano.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function FreeTierCTASection() {
  const { data: stats } = trpc.partnership.getPartnerStats.useQuery();

  if (stats?.hasFreeTier) {
    return null;
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border-amber-500/30">
      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/25 shrink-0">
          <Gift className="h-8 w-8 text-white" />
        </div>

        <div className="flex-1">
          <h2 className="text-xl font-bold mb-2">
            Quer ter mensalidade GRÁTIS?
          </h2>
          <p className="text-muted-foreground mb-4">
            A partir de <strong>5 clientes indicados ativos</strong>, sua
            mensalidade de{" "}
            <span className="font-semibold">
              {formatCurrency(MONTHLY_PRICE)}
            </span>{" "}
            é zerada! Além disso, você continua recebendo as comissões
            normalmente.
          </p>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>
                Economia de{" "}
                <strong>{formatCurrency(MONTHLY_PRICE * 12)}/ano</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Comissões continuam sendo pagas</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Sem limite de indicações</span>
            </div>
          </div>
        </div>

        <div className="text-center lg:text-right shrink-0">
          <p className="text-3xl font-bold text-amber-600">5</p>
          <p className="text-sm text-muted-foreground">clientes para</p>
          <p className="text-sm font-semibold">mensalidade grátis</p>
        </div>
      </div>
    </Card>
  );
}

export default function PartnershipPage() {
  const { user } = useUser();

  return (
    <div className={cn("space-y-6", lexendDeca.className)}>
      <div>
        <h1 className="text-2xl font-bold">Programa de Parceria</h1>
        <p className="text-muted-foreground">
          Indique empresas e ganhe {COMMISSION_PERCENT}% de comissão recorrente
        </p>
      </div>

      <StatsSection />
      <HowItWorksSection />
      <PartnerCodeSection />
      <ReferredTenantsSection />
      <CalculatorSection />
      <FreeTierCTASection />
    </div>
  );
}
