import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { HOME_SITES } from "@/lib/octave";
import { cn } from "@/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { type ReactNode, useState } from "react";

/** Every theory page, in navigation order. */
export const NAV_ITEMS = [
  { to: "/", label: "Home" },
  { to: "/transcendence", label: "Transcendence" },
  { to: "/love", label: "Love model" },
  { to: "/fourier", label: "Fourier & Gaussian" },
  { to: "/projection", label: "Projection & metaphor" },
  { to: "/notebook", label: "Notebook" },
  { to: "/essays", label: "Essays" },
  { to: "/concepts", label: "Concept index" },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav
      aria-label="Theory pages"
      className="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-0.5"
    >
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            data-ocid={`nav.link.${item.label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`}
            className={cn(
              "rounded-md px-3 py-2 text-sm transition-smooth",
              active
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** The persistent app shell: header, content area, and attribution footer. */
export function Layout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const year = new Date().getFullYear();
  const host = typeof window === "undefined" ? "" : window.location.hostname;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="flex min-w-0 items-center gap-2.5"
            data-ocid="nav.home_link"
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-primary font-mono text-sm font-bold text-primary-foreground"
              aria-hidden="true"
            >
              L
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-base font-semibold leading-tight">
                Laegna Octave Lab
              </span>
              <span className="block truncate text-[11px] leading-tight text-muted-foreground">
                rank space · integral levels · transcendence
              </span>
            </span>
          </Link>

          <div className="hidden lg:block">
            <NavLinks />
          </div>

          <div className="lg:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Open navigation"
                  data-ocid="nav.open_modal_button"
                >
                  <Menu className="h-4 w-4" aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 bg-card">
                <SheetHeader>
                  <SheetTitle className="font-display">Theory pages</SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  <NavLinks onNavigate={() => setOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1 bg-background">{children}</main>

      <footer className="border-t border-border bg-muted/40">
        <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <p className="font-display text-sm font-semibold">
                Laegna Octave Lab
              </p>
              <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted-foreground">
                A working lab for the octave ladder — explaining, visualizing,
                and simulating the math rather than only describing it.
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Home sites
              </p>
              <ul className="mt-3 space-y-2">
                {HOME_SITES.map((site) => (
                  <li key={site.url}>
                    <a
                      href={site.url}
                      target="_blank"
                      rel="noreferrer"
                      className="readout text-xs text-foreground underline-offset-4 hover:text-primary hover:underline"
                    >
                      {site.label}
                    </a>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">
                      {site.note}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                The lab
              </p>
              <ul className="mt-3 space-y-2">
                {NAV_ITEMS.slice(1).map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-border pt-6">
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(host)}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              © {year}. Built with love using caffeine.ai
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
