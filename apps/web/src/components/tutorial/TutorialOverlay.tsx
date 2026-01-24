"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useTutorial } from "@/hooks/useTutorial";
import { TutorialCard } from "./TutorialCard";
import { TutorialSpotlight } from "./TutorialSpotlight";
import { SetupLoadingScreen } from "@/components/setup/SetupLoadingScreen";
import {
  Sparkles,
  LayoutDashboard,
  Wrench,
  FileEdit,
  DollarSign,
  Clock,
  Check,
  Rocket,
} from "lucide-react";

export function TutorialOverlay() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    isActive,
    currentStep,
    nextStep,
    prevStep,
    skipTutorial,
    completeTutorial,
    setStep,
  } = useTutorial();

  // Ensure component only renders on client
  const [isMounted, setIsMounted] = useState(false);
  // Show loading screen before starting tutorial
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Callback when loading screen finishes
  const handleLoadingComplete = useCallback(() => {
    setShowLoadingScreen(false);
    useTutorial.getState().startTutorial();
    // Clean up URL param
    const url = new URL(window.location.href);
    url.searchParams.delete("tutorial");
    window.history.replaceState({}, "", url.toString());
  }, []);

  // Auto-start tutorial from setup - show loading screen first
  useEffect(() => {
    if (
      searchParams.get("tutorial") === "start" &&
      !isActive &&
      !showLoadingScreen
    ) {
      setShowLoadingScreen(true);
    }
  }, [searchParams, isActive, showLoadingScreen]);

  // Step-based navigation
  useEffect(() => {
    if (!isActive) return;

    switch (currentStep) {
      case "navigate-services":
        setTimeout(() => {
          router.push("/dashboard/services?tutorial=active");
          setStep("services-page");
        }, 1500);
        break;

      case "new-service-form":
        setTimeout(() => {
          router.push("/dashboard/services/new?tutorial=active");
          setStep("service-name");
        }, 1500);
        break;

      case "complete":
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        setTimeout(() => {
          completeTutorial();
        }, 3000);
        break;
    }
  }, [currentStep, isActive, router, setStep, completeTutorial]);

  if (!isMounted) return null;

  // Show loading screen before tutorial starts
  if (showLoadingScreen) {
    return (
      <SetupLoadingScreen
        onComplete={handleLoadingComplete}
        minDuration={2500}
      />
    );
  }

  if (!isActive) return null;

  const totalSteps = 9;
  const stepNumber =
    [
      "welcome",
      "dashboard-overview",
      "navigate-services",
      "services-page",
      "new-service-form",
      "service-name",
      "service-price",
      "service-time",
      "service-save",
    ].indexOf(currentStep) + 1;

  return (
    <AnimatePresence mode="wait">
      {currentStep === "welcome" && (
        <div key="welcome-step">
          <TutorialSpotlight targetId="" isActive={false} />
          <TutorialCard
            title="Bem-vindo ao Autevo! 🚀"
            description={
              <div className="space-y-2">
                <p>
                  Este é o seu <strong>sistema completo</strong> de gestão
                  automotiva.
                </p>
                <p>
                  Vamos configurar seu <strong>primeiro serviço</strong> juntos
                  em apenas alguns passos!
                </p>
              </div>
            }
            icon={<Sparkles className="h-8 w-8 text-blue-400" />}
            currentStep={stepNumber}
            totalSteps={totalSteps}
            onNext={nextStep}
            onSkip={skipTutorial}
            position="center"
            showPrev={false}
          />
        </div>
      )}

      {currentStep === "dashboard-overview" && pathname === "/dashboard" && (
        <div key="dashboard-overview-step">
          <TutorialSpotlight targetId="dashboard-welcome" isActive={true} />
          <TutorialCard
            title="Painel de Controle"
            description={
              <div className="space-y-2">
                <p>
                  Este é o seu <strong>Dashboard</strong>. Aqui você monitora
                  tudo em tempo real:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Agendamentos do dia</li>
                  <li>Ordens de serviço em andamento</li>
                  <li>Total de clientes cadastrados</li>
                </ul>
              </div>
            }
            icon={<LayoutDashboard className="h-8 w-8 text-blue-400" />}
            currentStep={stepNumber}
            totalSteps={totalSteps}
            onNext={nextStep}
            onPrev={prevStep}
            onSkip={skipTutorial}
            position="bottom"
          />
        </div>
      )}

      {currentStep === "navigate-services" && (
        <div key="navigate-services-step">
          <TutorialSpotlight targetId="nav-services" isActive={true} />
          <TutorialCard
            title="Vamos ao Catálogo de Serviços"
            description="Clique no menu 'Serviços' na barra lateral para gerenciar os serviços que sua oficina oferece."
            icon={<Wrench className="h-8 w-8 text-blue-400" />}
            currentStep={stepNumber}
            totalSteps={totalSteps}
            onNext={nextStep}
            onPrev={prevStep}
            onSkip={skipTutorial}
            position="center"
            nextLabel="Ir para Serviços"
          />
        </div>
      )}

      {currentStep === "services-page" &&
        pathname === "/dashboard/services" && (
          <div key="services-page-step">
            <TutorialSpotlight targetId="btn-new-service" isActive={true} />
            <TutorialCard
              title="Criar Primeiro Serviço"
              description="Aqui você gerencia todos os serviços que oferece. Vamos criar o primeiro! Clique em 'Novo Serviço'."
              icon={<FileEdit className="h-8 w-8 text-blue-400" />}
              currentStep={stepNumber}
              totalSteps={totalSteps}
              onNext={nextStep}
              onPrev={prevStep}
              onSkip={skipTutorial}
              position="bottom"
              nextLabel="Criar Serviço"
            />
          </div>
        )}

      {currentStep === "service-name" &&
        pathname === "/dashboard/services/new" && (
          <div key="service-name-step">
            <TutorialSpotlight targetId="name" isActive={true} />
            <TutorialCard
              title="Nome do Serviço"
              description={
                <div className="space-y-2">
                  <p>Digite o nome do serviço.</p>
                  <p className="text-sm text-gray-400">
                    Sugestão:{" "}
                    <strong className="text-white">Lavagem Completa</strong>
                  </p>
                </div>
              }
              icon={<FileEdit className="h-8 w-8 text-blue-400" />}
              currentStep={stepNumber}
              totalSteps={totalSteps}
              onNext={nextStep}
              onPrev={prevStep}
              onSkip={skipTutorial}
              position="bottom"
            />
          </div>
        )}

      {currentStep === "service-price" &&
        pathname === "/dashboard/services/new" && (
          <div key="service-price-step">
            <TutorialSpotlight targetId="basePrice" isActive={true} />
            <TutorialCard
              title="Preço Base"
              description={
                <div className="space-y-2">
                  <p>Defina o valor do serviço.</p>
                  <p className="text-sm text-gray-400">
                    Sugestão: <strong className="text-white">R$ 150,00</strong>
                  </p>
                  <p className="text-xs text-gray-500">
                    Você pode ajustar o preço para cada tipo de veículo depois.
                  </p>
                </div>
              }
              icon={<DollarSign className="h-8 w-8 text-green-400" />}
              currentStep={stepNumber}
              totalSteps={totalSteps}
              onNext={nextStep}
              onPrev={prevStep}
              onSkip={skipTutorial}
              position="bottom"
            />
          </div>
        )}

      {currentStep === "service-time" &&
        pathname === "/dashboard/services/new" && (
          <div key="service-time-step">
            <TutorialSpotlight targetId="estimatedTime" isActive={true} />
            <TutorialCard
              title="Tempo Estimado"
              description={
                <div className="space-y-2">
                  <p>Quanto tempo leva este serviço?</p>
                  <p className="text-sm text-gray-400">
                    Isso ajuda a calcular a previsão de entrega, mas{" "}
                    <strong>não é obrigatório</strong>.
                  </p>
                  <p className="text-xs text-gray-500">
                    Você pode pular se preferir ou preencher depois.
                  </p>
                </div>
              }
              icon={<Clock className="h-8 w-8 text-purple-400" />}
              currentStep={stepNumber}
              totalSteps={totalSteps}
              onNext={nextStep}
              onPrev={prevStep}
              onSkip={skipTutorial}
              position="bottom"
            />
          </div>
        )}

      {currentStep === "service-save" &&
        pathname === "/dashboard/services/new" && (
          <div key="service-save-step">
            <TutorialSpotlight targetId="service-save-button" isActive={true} />
            <TutorialCard
              title="Salvar Serviço"
              description={
                <div className="space-y-2">
                  <p>
                    Perfeito! Agora é só <strong>salvar</strong>.
                  </p>
                  <p className="text-sm text-gray-400">
                    Seu primeiro serviço será criado e você poderá usá-lo em
                    ordens de serviço!
                  </p>
                </div>
              }
              icon={<Check className="h-8 w-8 text-green-400" />}
              currentStep={stepNumber}
              totalSteps={totalSteps}
              onNext={() => {
                setStep("complete");
              }}
              onPrev={prevStep}
              onSkip={skipTutorial}
              position="bottom"
              nextLabel="Salvar Agora"
            />
          </div>
        )}

      {currentStep === "complete" && (
        <div key="complete-step">
          <TutorialSpotlight targetId="" isActive={false} />
          <TutorialCard
            title="Parabéns! 🎉"
            description={
              <div className="space-y-2">
                <p>
                  Você criou seu <strong>primeiro serviço</strong> com sucesso!
                </p>
                <p className="text-sm text-gray-400">
                  Agora você pode criar clientes, veículos e começar a gerenciar
                  suas ordens de serviço.
                </p>
                <p className="text-sm text-blue-400 font-semibold">
                  Bem-vindo ao Autevo! 🚀
                </p>
              </div>
            }
            icon={<Rocket className="h-8 w-8 text-yellow-400" />}
            currentStep={totalSteps}
            totalSteps={totalSteps}
            onNext={completeTutorial}
            onSkip={completeTutorial}
            position="center"
            showPrev={false}
            nextLabel="Começar a Usar"
          />
        </div>
      )}
    </AnimatePresence>
  );
}
