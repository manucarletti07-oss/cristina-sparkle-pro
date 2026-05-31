import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PRIVATE_EMAIL = "cristina.cebrian@gmail.com";
const PRIVATE_PASSWORD = "ingresos123";

type PrivateAccessGateProps = {
  title: string;
  sessionKey: string;
  onUnlocked: () => void;
};

export function PrivateAccessGate({ title, sessionKey, onUnlocked }: PrivateAccessGateProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (sessionStorage.getItem(sessionKey) === "1") onUnlocked();
  }, [onUnlocked, sessionKey]);

  return (
    <div className="min-h-screen bg-foreground text-background flex items-center justify-center p-6">
      <div className="glass-dark rounded-2xl p-8 w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto size-14 rounded-full bg-primary/15 flex items-center justify-center">
            <Lock className="size-6 text-primary" />
          </div>
          <h1 className="font-display text-2xl">{title}</h1>
          <p className="text-sm text-background/60">Introduce el correo y la contraseña para continuar.</p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (email.trim().toLowerCase() === PRIVATE_EMAIL && password === PRIVATE_PASSWORD) {
              sessionStorage.setItem(sessionKey, "1");
              onUnlocked();
              setEmail("");
              setPassword("");
            } else {
              toast.error("Correo o contraseña incorrectos");
            }
          }}
          className="space-y-3"
        >
          <div className="space-y-2">
            <Label className="text-background/80">Correo</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background/5 border-primary/30 text-background pl-10"
                placeholder="cristina.cebrian@gmail.com"
                autoFocus
                autoComplete="off"
                name="private-email"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-background/80">Contraseña</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-background/5 border-primary/30 text-background"
              placeholder="ingresos123"
              autoComplete="new-password"
              name="private-password"
              required
            />
          </div>
          <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            Entrar
          </Button>
          <Button asChild type="button" variant="outline" className="w-full border-primary/30 text-primary bg-transparent">
            <Link to="/admin"><ArrowLeft className="size-4" /> Volver al panel</Link>
          </Button>
        </form>
      </div>
    </div>
  );
}