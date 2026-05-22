import { Link } from "@tanstack/react-router";
import { Instagram, MapPin, Phone } from "lucide-react";
import { SITE } from "@/lib/config";

export function Footer() {
  return (
    <footer id="contacto" className="bg-foreground text-background pt-24 pb-10">
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-12">
        <div>
          <h4 className="font-display text-primary text-sm tracking-[0.3em] mb-5">UBICACIÓN</h4>
          <a
            href={SITE.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="flex gap-3 text-sm leading-relaxed text-background/80 hover:text-primary transition-colors"
          >
            <MapPin className="size-4 text-primary shrink-0 mt-0.5" />
            <span>{SITE.address}</span>
          </a>
        </div>
        <div>
          <h4 className="font-display text-primary text-sm tracking-[0.3em] mb-5">CONTACTO</h4>
          <ul className="space-y-3 text-sm text-background/80">
            <li>
              <a href={`tel:${SITE.phone.replace(/\s/g, "")}`} className="flex gap-3 hover:text-primary transition-colors">
                <Phone className="size-4 text-primary shrink-0 mt-0.5" />
                <span>{SITE.phone}</span>
              </a>
            </li>
            <li>
              <a href={SITE.instagram} target="_blank" rel="noreferrer" className="flex gap-3 hover:text-primary transition-colors">
                <Instagram className="size-4 text-primary shrink-0 mt-0.5" />
                <span>@cristinaesteticaavanzada</span>
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-primary text-sm tracking-[0.3em] mb-5">LEGAL</h4>
          <Link to="/terminos" className="text-sm text-background/80 hover:text-primary transition-colors">
            Términos Legales
          </Link>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 mt-14 pt-8 border-t border-primary/20 text-center">
        <p className="font-display italic text-primary/90 text-sm">
          © {new Date().getFullYear()} Cristina Cebrián · Estética Avanzada Alcorcón
        </p>
      </div>
    </footer>
  );
}