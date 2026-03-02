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
  ShieldCheck,
  TrendingUp,
  Database,
  CalendarCheck,
  Zap,
  Camera,
  Share2,
  PackageCheck,
  Network,
  Activity,
  Rocket,
  Lock,
  Users,
  Settings,
} from "lucide-react";

export function TutorialOverlay() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    isActive,
    hideCard,
    currentStep,
    nextStep,
    setStep,
    setHideCard,
    skipTutorial,
    completeTutorial,
  } = useTutorial();

  const [isMounted, setIsMounted] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLoadingComplete = useCallback(() => {
    setShowLoadingScreen(false);
    useTutorial.getState().startTutorial();
    const url = new URL(window.location.href);
    url.searchParams.delete("tutorial");
    window.history.replaceState({}, "", url.toString());
  }, []);

  useEffect(() => {
    if (searchParams.get("tutorial") === "start" && !showLoadingScreen) {
      setShowLoadingScreen(true);
    }
  }, [searchParams, showLoadingScreen]);

  // Route watchers for event-driven step progression
  useEffect(() => {
    if (!isActive || hideCard === false) return;

    // We removed the implicit hideCard behavior for OS payload
    // because it was confusing. Now they just click to see both steps.
  }, [currentStep, isActive, pathname, setStep, setHideCard, hideCard]);

  // Effect for Completion Confetti
  useEffect(() => {
    if (isActive && currentStep === "complete") {
      confetti({
        particleCount: 200,
        spread: 90,
        origin: { y: 0.6 },
        colors: ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B"],
      });
      setTimeout(() => {
        completeTutorial();
      }, 4000);
    }
  }, [currentStep, isActive, completeTutorial]);

  if (!isMounted) return null;

  if (showLoadingScreen) {
    return (
      <SetupLoadingScreen
        onComplete={handleLoadingComplete}
        minDuration={2500}
      />
    );
  }

  if (!isActive) return null;

  // Return null if hiding card, so it doesn't block the user from interacting
  if (hideCard) return null;

  const stepsList = [
    "baptism-hook",
    "finance-hook",
    "finance-payload",
    "customer-hook",
    "customer-payload",
    "agenda-hook",
    "agenda-payload",
    "os-hook",
    "os-payload",
    "os-closing",
    "settings-hook",
    "settings-payload",
  ];

  const totalSteps = stepsList.length;
  // Fallback to step 1 if not in list
  const stepIndex = stepsList.indexOf(currentStep);
  const stepNumber = stepIndex >= 0 ? stepIndex + 1 : 1;

  // Handlers for hybrid navigation
  const handleNav = (
    targetPath: string,
    nextCurrentStep: typeof currentStep,
  ) => {
    router.push(targetPath);
    setStep(nextCurrentStep);
  };

  return (
    <AnimatePresence mode="wait">
      {currentStep === "baptism-hook" && (
        <div key="baptism">
          <TutorialSpotlight targetId="sidebar-logo" isActive={true} />
          <TutorialCard
            title="Início: Sua Operação"
            description={
              <div className="space-y-2">
                <p>
                  Sua oficina agora opera sob um sistema de{" "}
                  <strong>nível enterprise</strong>. Note que a sua marca
                  comanda a operação.
                </p>
                <p>
                  Tudo o que circular aqui levará sua autoridade para o seu
                  cliente.
                </p>
              </div>
            }
            icon={<ShieldCheck className="h-8 w-8 text-blue-400" />}
            currentStep={1}
            totalSteps={totalSteps}
            onNext={() => setStep("finance-hook")}
            onSkip={skipTutorial}
            position="center"
            showPrev={false}
            nextLabel="Próximo"
          />
        </div>
      )}

      {currentStep === "finance-hook" && (
        <div key="finance-hook">
          <TutorialSpotlight targetId="nav-financial" isActive={true} />
          <TutorialCard
            title="Acessar Caixa"
            description={
              <div className="space-y-2">
                <p>
                  Seu objetivo não é apenas consertar carros, é maximizar
                  margem.
                </p>
                <p>Vamos ver onde a saúde da sua empresa vai residir.</p>
              </div>
            }
            icon={<TrendingUp className="h-8 w-8 text-emerald-400" />}
            currentStep={2}
            totalSteps={totalSteps}
            onNext={() => handleNav("/dashboard/financial", "finance-payload")}
            onSkip={skipTutorial}
            position="center"
            showPrev={false}
            nextLabel="Acessar Financeiro"
          />
        </div>
      )}

      {currentStep === "finance-payload" && (
        <div key="finance-payload">
          <TutorialSpotlight targetId="financial-summary" isActive={true} />
          <TutorialCard
            title="Controle de Margem"
            description={
              <div className="space-y-2">
                <p>
                  Este é o seu Cofre. Aqui, toda Ordem de Serviço faturada
                  reflete em tempo real.
                </p>
                <p>
                  Fechou o mês? Comissões de técnicos são calculadas sozinhas.
                  Zero margem para erros humanos.
                </p>
              </div>
            }
            icon={<Lock className="h-8 w-8 text-emerald-400" />}
            currentStep={3}
            totalSteps={totalSteps}
            onNext={() => setStep("customer-hook")}
            onSkip={skipTutorial}
            position="center"
            showPrev={false}
            nextLabel="Próximo"
          />
        </div>
      )}

      {currentStep === "customer-hook" && (
        <div key="customer-hook">
          <TutorialSpotlight targetId="nav-customers" isActive={true} />
          <TutorialCard
            title="Gestão de Clientes"
            description={
              <div className="space-y-2">
                <p>
                  Mas para ter receita financeira, precisamos do seu primeiro
                  ativo: <strong>Clientes estruturados.</strong>
                </p>
              </div>
            }
            icon={<Users className="h-8 w-8 text-purple-400" />}
            currentStep={4}
            totalSteps={totalSteps}
            onNext={() => handleNav("/dashboard/customers", "customer-payload")}
            onSkip={skipTutorial}
            position="center"
            showPrev={false}
            nextLabel="Acessar Clientes"
          />
        </div>
      )}

      {currentStep === "customer-payload" && (
        <div key="customer-payload">
          <TutorialSpotlight targetId="btn-new-customer" isActive={true} />
          <TutorialCard
            title="Histórico Seguro"
            description={
              <div className="space-y-2">
                <p>
                  Cadastre veículos e donos. O sistema organiza o histórico de
                  vistorias e aprovações de forma vitalícia.
                </p>
                <p>
                  A prova de que um serviço antigo foi executado ou de uma peça
                  trocada estará sempre a um clique de distância.
                </p>
              </div>
            }
            icon={<Database className="h-8 w-8 text-purple-400" />}
            currentStep={5}
            totalSteps={totalSteps}
            onNext={() => setStep("agenda-hook")}
            onSkip={skipTutorial}
            position="bottom"
            showPrev={false}
            nextLabel="Próximo"
          />
        </div>
      )}

      {currentStep === "agenda-hook" && (
        <div key="agenda-hook">
          <TutorialSpotlight targetId="nav-scheduling" isActive={true} />
          <TutorialCard
            title="Agenda: Escalonamento de Tempo"
            description={
              <div className="space-y-2">
                <p>
                  Tempo não gerenciado é caixa perdido. Vamos olhar a sua linha
                  de montagem e evitar que os elevadores fiquem vazios.
                </p>
              </div>
            }
            icon={<CalendarCheck className="h-8 w-8 text-orange-400" />}
            currentStep={6}
            totalSteps={totalSteps}
            onNext={() => handleNav("/dashboard/scheduling", "agenda-payload")}
            onSkip={skipTutorial}
            position="center"
            showPrev={false}
            nextLabel="Ver Agenda"
          />
        </div>
      )}

      {currentStep === "agenda-payload" && (
        <div key="agenda-payload">
          <TutorialSpotlight targetId="calendar-grid" isActive={true} />
          <TutorialCard
            title="Controle de Fluxo"
            description={
              <div className="space-y-2">
                <p>Nunca mais aceite trabalho em sobreposição.</p>
                <p>
                  Uma olhada aqui e você sabe exatamente qual técnico está livre
                  e qual prancheta está lotada.
                </p>
              </div>
            }
            icon={<PackageCheck className="h-8 w-8 text-orange-400" />}
            currentStep={7}
            totalSteps={totalSteps}
            onNext={() => setStep("os-hook")}
            onSkip={skipTutorial}
            position="center"
            showPrev={false}
            nextLabel="Próximo"
          />
        </div>
      )}

      {currentStep === "os-hook" && (
        <div key="os-hook">
          <TutorialSpotlight targetId="nav-orders" isActive={true} />
          <TutorialCard
            title="Serviços: Nova OS"
            description={
              <div className="space-y-2">
                <p>
                  Chegou a hora de faturar. Tudo no sistema converge para o
                  Cérebro da Oficina:{" "}
                  <strong>O Sequenciador de Ordens de Serviço</strong>.
                </p>
              </div>
            }
            icon={<Zap className="h-8 w-8 text-yellow-500" />}
            currentStep={8}
            totalSteps={totalSteps}
            onNext={() => handleNav("/dashboard/orders/new", "os-payload")}
            onSkip={skipTutorial}
            position="center"
            showPrev={false}
            nextLabel="Criar OS"
          />
        </div>
      )}

      {currentStep === "os-payload" && (
        <div key="os-payload">
          <TutorialSpotlight targetId="btn-submit-order" isActive={true} />
          <TutorialCard
            title="Vistoria Digital"
            description={
              <div className="space-y-2">
                <p>
                  <strong className="text-yellow-400">
                    Aviso de Segurança:
                  </strong>{" "}
                  Registre avarias com fotos antes de começar qualquer coisa.
                </p>
                <p>
                  Nosso streaming seguro manda para nuvem e cria um escudo legal
                  blindado contra reclamações de clientes ("isso aqui não tava
                  riscado não").
                </p>
              </div>
            }
            icon={<Camera className="h-8 w-8 text-blue-300" />}
            currentStep={9}
            totalSteps={totalSteps}
            onNext={() => setStep("os-closing")}
            onSkip={skipTutorial}
            position="center"
            showPrev={false}
            nextLabel="Entendi!"
          />
        </div>
      )}

      {currentStep === "os-closing" && (
        <div key="os-closing">
          <TutorialSpotlight targetId="btn-submit-order" isActive={true} />
          <TutorialCard
            title="Coleta de Assinatura"
            description={
              <div className="space-y-2">
                <p>
                  Ao final de tudo, dispare o link para o cliente aprovar via
                  celular.
                </p>
                <p>
                  O Autevo cravará o endereço IP e dados técnicos do aparelho na
                  assinatura. Finalize sua OS, envie o link e corra pro abraço.
                </p>
              </div>
            }
            icon={<Share2 className="h-8 w-8 text-yellow-400" />}
            currentStep={10}
            totalSteps={totalSteps}
            onNext={() => setStep("settings-hook")}
            onSkip={skipTutorial}
            position="center"
            showPrev={false}
            nextLabel="Próximo"
          />
        </div>
      )}

      {currentStep === "settings-hook" && (
        <div key="settings-hook">
          <TutorialSpotlight targetId="nav-settings" isActive={true} />
          <TutorialCard
            title="Ajustes: Acessar Configurações"
            description={
              <div className="space-y-2">
                <p>
                  Todo o sistema é configurável para se adequar a sua realidade
                  de negócios.
                </p>
                <p>
                  Vamos configurar suas regras operacionais e de comissoes
                  nativas.
                </p>
              </div>
            }
            icon={<Settings className="h-8 w-8 text-zinc-400" />}
            currentStep={11}
            totalSteps={totalSteps}
            onNext={() =>
              handleNav(
                "/dashboard/settings?tab=operacional",
                "settings-payload",
              )
            }
            onSkip={skipTutorial}
            position="center"
            showPrev={false}
            nextLabel="Configurar Regras"
          />
        </div>
      )}

      {currentStep === "settings-payload" && (
        <div key="settings-payload">
          <TutorialSpotlight
            targetId="operational-settings-card"
            isActive={true}
          />
          <TutorialCard
            title="Personalizar Sistema"
            description={
              <div className="space-y-2">
                <p>
                  Habilite ou desabilite vistorias obrigatórias e defina o motor
                  de comissões por aqui.
                </p>
                <p>
                  Ao forçar uma assinatura na saída do veículo, o sistema cria
                  uma barreira jurídica instantânea para fechar todos os seus
                  fluxos com garantias.
                </p>
                <p className="text-xl font-bold text-blue-400 mt-2">
                  Fim de tutorial. Seja bem-vindo ao topo.
                </p>
              </div>
            }
            icon={<ShieldCheck className="h-8 w-8 text-cyan-400" />}
            currentStep={12}
            totalSteps={totalSteps}
            onNext={() => setStep("complete")}
            onSkip={skipTutorial}
            position="center"
            showPrev={false}
            nextLabel="Concluir!"
          />
        </div>
      )}
    </AnimatePresence>
  );
}
