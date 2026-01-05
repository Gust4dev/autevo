"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Users, Loader2, ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useUser } from "@clerk/nextjs";

export default function WelcomePage() {
  const { user } = useUser();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const createCompany = trpc.tenant.createForUser.useMutation({
    onSuccess: () => {
      router.push("/setup");
      router.refresh();
    },
    onError: () => setIsCreating(false),
  });

  const confirmWaiting = trpc.user.confirmWaitingForInvite.useMutation({
    onSuccess: () => {
      router.push("/awaiting-invite");
      router.refresh();
    },
  });

  const handleCreateBusiness = () => {
    setIsCreating(true);
    createCompany.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Bem-vindo, {user?.firstName || "Usuário"}! 👋
          </h1>
          <p className="text-muted-foreground text-lg">
            O que você gostaria de fazer?
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Card
            className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 group"
            onClick={handleCreateBusiness}
          >
            <CardHeader className="pb-3">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                <Building2 className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-xl">
                Cadastrar meu estabelecimento
              </CardTitle>
              <CardDescription>
                Quero configurar minha própria empresa no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    Começar configuração
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer transition-all hover:shadow-lg hover:border-blue-500/50 group"
            onClick={() => confirmWaiting.mutate()}
          >
            <CardHeader className="pb-3">
              <div className="w-14 h-14 bg-blue-500/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-500/20 transition-colors">
                <Users className="h-7 w-7 text-blue-600" />
              </div>
              <CardTitle className="text-xl">
                Entrar em um estabelecimento
              </CardTitle>
              <CardDescription>
                Fui convidado para acessar o sistema de uma empresa existente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full border-blue-500/50 text-blue-600 hover:bg-blue-50"
                disabled={confirmWaiting.isPending}
              >
                {confirmWaiting.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Aguarde...
                  </>
                ) : (
                  <>
                    Aguardar convite
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Você pode mudar essa escolha depois nas configurações.
        </p>
      </div>
    </div>
  );
}
