import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background">
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
      <div className="relative z-10 animate-fade-in-up">
        <SignIn 
          appearance={{
            elements: {
              card: "bg-card/50 backdrop-blur-md border border-border/50 shadow-xl",
              headerTitle: "text-foreground",
              headerSubtitle: "text-muted-foreground",
              socialButtonsBlockButton: "bg-card border-border hover:bg-accent text-foreground",
              formFieldLabel: "text-foreground",
              formFieldInput: "bg-background/50 border-input text-foreground",
              footerActionLink: "text-primary hover:text-primary/90",
              formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90"
            }
          }}
        />
      </div>
    </div>
  );
}
