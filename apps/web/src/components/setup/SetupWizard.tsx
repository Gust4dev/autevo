"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUser } from "@clerk/nextjs";
import { Loader2, Check, Store, User, MapPin, Palette } from "lucide-react";
import { toast } from "sonner";

// Schema matches the router input
const setupSchema = z.object({
  jobTitle: z.string().min(2, "Informe seu cargo"),
  tenantName: z.string().min(2, "Informe o nome da empresa"),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida")
    .optional(),
  logo: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type SetupFormData = z.infer<typeof setupSchema>;

export function SetupWizard() {
  const { user } = useUser();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      jobTitle: "",
      tenantName: user?.firstName ? `Oficina de ${user.firstName}` : "",
      primaryColor: "#DC2626", // Default Red
      logo: "",
      email: "",
      phone: "",
      address: "",
    },
  });

  const mutation = trpc.tenant.updateSetup.useMutation({
    onSuccess: () => {
      toast.success("Configuração concluída com sucesso!");
      router.refresh(); // Clear Router Cache to prevent redirect loop
      router.push("/dashboard?tutorial=start");
    },
    onError: (error) => {
      toast.error(`Erro ao salvar: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  const onSubmit = async (data: SetupFormData) => {
    setIsSubmitting(true);
    mutation.mutate(data);
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof SetupFormData)[] = [];

    if (step === 1) fieldsToValidate = ["jobTitle"];
    if (step === 2) fieldsToValidate = ["tenantName", "primaryColor"];

    const isValid = await form.trigger(fieldsToValidate);

    if (isValid) {
      setStep((s) => s + 1);
    }
  };

  const prevStep = () => {
    setStep((s) => s - 1);
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8 px-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex flex-col items-center gap-2">
            <div
              className={`
                        flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
                        ${
                          step >= s
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted text-muted-foreground"
                        }
                    `}
            >
              {step > s ? <Check className="w-5 h-5" /> : s}
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {s === 1 && "Perfil"}
              {s === 2 && "Empresa"}
              {s === 3 && "Detalhes"}
            </span>
          </div>
        ))}
        {/* Lines between steps */}
        <div className="absolute top-[4.5rem] left-0 w-full -z-10 hidden md:block" />
        {/* Simple spacer logic doesn't work well with flex-between, skipping line drawing for simplicity */}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {step === 1 && "Configuração de Perfil"}
            {step === 2 && "Identidade da Empresa"}
            {step === 3 && "Informações de Contato"}
          </CardTitle>
          <CardDescription>
            {step === 1 && "Vamos começar definindo seu papel na empresa."}
            {step === 2 && "Personalize a aparência do seu sistema."}
            {step === 3 && "Como seus clientes podem entrar em contato?"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            id="setup-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            {/* STEP 1: PROFILE */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <Label>Seu Nome</Label>
                  <Input
                    value={user?.fullName || ""}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    O nome é gerenciado pela sua conta de acesso.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Seu Cargo / Função *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="jobTitle"
                      placeholder="Ex: Gerente, Mecânico Chefe, Proprietário"
                      className="pl-9"
                      {...form.register("jobTitle")}
                    />
                  </div>
                  {form.formState.errors.jobTitle && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.jobTitle.message}
                    </p>
                  )}
                </div>

                <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
                  <p className="text-sm text-blue-600">
                    <strong>Nota:</strong> Como criador da conta, você terá
                    acesso administrativo total (Role: OWNER).
                  </p>
                </div>
              </div>
            )}

            {/* STEP 2: BRANDING */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <Label htmlFor="tenantName">Nome da Empresa *</Label>
                  <div className="relative">
                    <Store className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="tenantName"
                      placeholder="Ex: Auto Center Silva"
                      className="pl-9"
                      {...form.register("tenantName")}
                    />
                  </div>
                  {form.formState.errors.tenantName && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.tenantName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Cor Principal</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Palette className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="primaryColor"
                        type="text"
                        placeholder="#000000"
                        className="pl-9"
                        {...form.register("primaryColor")}
                      />
                    </div>
                    <Input
                      type="color"
                      className="w-12 p-1 cursor-pointer"
                      {...form.register("primaryColor")}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logo">URL do Logo (Opcional)</Label>
                  <Input
                    id="logo"
                    placeholder="https://..."
                    {...form.register("logo")}
                  />
                  <p className="text-xs text-muted-foreground">
                    Você poderá fazer upload de uma imagem depois nas
                    configurações.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 3: CONTACT DETAILS */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Comercial</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contato@suaempresa.com"
                    {...form.register("email")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone / WhatsApp</Label>
                  <Input
                    id="phone"
                    placeholder="(11) 99999-9999"
                    {...form.register("phone")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Endereço Completo</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="address"
                      placeholder="Rua Exemplo, 123 - Centro"
                      className="pl-9"
                      {...form.register("address")}
                    />
                  </div>
                </div>
              </div>
            )}
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={step === 1 || isSubmitting}
          >
            Voltar
          </Button>

          {step < 3 ? (
            <Button onClick={nextStep}>Próximo</Button>
          ) : (
            <Button
              onClick={form.handleSubmit(onSubmit)}
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Concluir Configuração
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
