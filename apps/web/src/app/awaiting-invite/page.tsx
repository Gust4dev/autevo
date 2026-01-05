"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, LogOut, Mail } from "lucide-react";

export default function AwaitingInvitePage() {
  const { user } = useUser();
  const { signOut } = useClerk();

  const handleSignOut = () => {
    signOut({ redirectUrl: "/" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center">
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Aguardando Convite</CardTitle>
          <CardDescription className="text-base">
            Olá,{" "}
            <span className="font-medium">
              {user?.firstName || user?.emailAddresses[0]?.emailAddress}
            </span>
            !
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <Mail className="h-5 w-5 flex-shrink-0 mt-0.5 text-blue-600" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">
                  Aguardando convite de uma empresa
                </p>
                <p className="text-blue-700">
                  Um administrador precisa te convidar para acessar o sistema.
                  Você receberá um email quando for adicionado.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Se você acredita que deveria ter acesso, entre em contato com o
            administrador da sua empresa.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
