"use client";
import { useId } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/learn", label: "Learn", icon: Brain },
  { href: "/courses", label: "Courses", icon: BookOpen },
] as const;

export const LOGO_LEFT = "#0d9488";
export const LOGO_RIGHT = "#16a34a";

const BOOK_LEFT_PAGE =
  "M12 6.6C9.2 5 5.6 5 3.8 6 3.4 6.2 3.1 6.5 3.1 6.9V18.2c0 .55.56.86 1.04.63C6 18 9.3 18 12 19.5Z";
const BOOK_RIGHT_PAGE =
  "M12 6.6C14.8 5 18.4 5 20.2 6 20.6 6.2 20.9 6.5 20.9 6.9V18.2c0 .55-.56.86-1.04.63C18 18 14.7 18 12 19.5Z";
const BOOK_SPINE = "M12 6.6V19.5";
const BOOK_RIBBON = "M10.8 6.3h2.4v6.9l-1.2-1.35-1.2 1.35Z";

export function BrandLogo({ className }: { className?: string }) {
  const gradientId = `brand-logo-${useId().replace(/:/g, "")}`;
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        <linearGradient
          id={gradientId}
          x1="4"
          y1="19"
          x2="20"
          y2="5"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={LOGO_LEFT} />
          <stop offset="1" stopColor={LOGO_RIGHT} />
        </linearGradient>
      </defs>
      <path d={BOOK_LEFT_PAGE} fill={`url(#${gradientId})`} />
      <path d={BOOK_RIGHT_PAGE} fill={`url(#${gradientId})`} opacity=".72" />
      <path d={BOOK_SPINE} stroke="#fff" strokeWidth="1" opacity=".45" />
      <path d={BOOK_RIBBON} fill="#fff" opacity=".95" />
    </svg>
  );
}

export function SidebarNav({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "brand-pill text-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
              collapsed && "justify-center px-0"
            )}
          >
            <Icon className="size-4 shrink-0" />
            {!collapsed && item.label}
          </Link>
        );
      })}
    </nav>
  );
}