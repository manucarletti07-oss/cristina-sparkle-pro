import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, Moon, Shield, Sun, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoginModal } from "./LoginModal";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";

export function Navbar({ onBookClick }: { onBookClick: () => void }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const { isAuth } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "/#servicios", label: "Servicios" },
    { href: "/#promociones", label: "Promociones" },
    { href: "/#sobre", label: "Sobre Mí" },
    { href: "/#contacto", label: "Contacto" },
  ];

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-background/85 backdrop-blur-xl border-b border-primary/15 py-3"
            : "bg-background/40 backdrop-blur-sm py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 md:px-10 flex items-center justify-between">
          <Link to="/" className="font-display tracking-[0.25em] text-sm md:text-base font-bold text-foreground">
            CRISTINA CEBRIÁN
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-[11px] uppercase tracking-[0.18em] font-semibold text-foreground/80 hover:text-primary transition-colors"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 md:gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-foreground hover:text-primary hover:bg-primary/10"
              title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
            >
              {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => (isAuth ? navigate({ to: "/admin" }) : setLoginOpen(true))}
              className="hidden sm:inline-flex text-[10px] uppercase tracking-[0.2em] text-primary hover:text-primary hover:bg-primary/10 border border-primary/30 rounded-full"
            >
              <Shield className="size-3.5" />
              {isAuth ? "Panel" : "Área Interna"}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setOpen(!open)}
              aria-label="Menú"
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>

        {open && (
          <div className="lg:hidden glass mx-5 mt-3 rounded-2xl p-5 animate-fade-up">
            <ul className="flex flex-col gap-4">
              {links.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block text-xs uppercase tracking-[0.2em] font-semibold text-foreground hover:text-primary"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
              <li className="sm:hidden">
                <button
                  onClick={() => {
                    setOpen(false);
                    isAuth ? navigate({ to: "/admin" }) : setLoginOpen(true);
                  }}
                  className="text-xs uppercase tracking-[0.2em] font-semibold text-primary"
                >
                  {isAuth ? "Panel admin" : "Área Interna"}
                </button>
              </li>
            </ul>
          </div>
        )}
      </header>

      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </>
  );
}