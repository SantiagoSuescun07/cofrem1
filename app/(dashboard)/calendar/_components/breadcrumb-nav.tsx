import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export function BreadcrumbNav() {
  return (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
      <Link
        href="/"
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
        <span>Inicio</span>
      </Link>
      <ChevronRight className="h-4 w-4" />
      <span className="text-foreground">Eventos calendario</span>
    </nav>
  );
}
