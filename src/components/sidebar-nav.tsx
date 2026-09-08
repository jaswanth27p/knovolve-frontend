"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/learn", label: "Learn", icon: Brain },
  { href: "/courses", label: "Courses", icon: BookOpen },
] as const;

export const LOGO_LEFT = "#8b5cf6";
export const LOGO_RIGHT = "#ec4899";

const BRAIN_PATHS = [
  "M12 18V5",
  "M15 13.2a4 4 0 0 1-3-4.6 4 4 0 0 1-3 4.6",
  "M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5",
  "M17.997 5.125a4 4 0 0 1 2.526 5.77",
  "M18 18a4 4 0 0 0 2-7.464",
  "M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517",
  "M6 18a4 4 0 0 1-2-7.464",
  "M6.003 5.125a4 4 0 0 0-2.526 5.77",
  "M7 9.6C8 8.9 9.1 9.1 10 9.9",
  "M17 9.6C16 8.9 14.9 9.1 14 9.9",
  "M6.8 14.8C8 14 9.3 14.3 10.6 15.2",
  "M17.2 14.8C16 14 14.7 14.3 13.4 15.2",
];

const BRAIN_LEFT_HALF =
  "M12 5.75C9.2 5.55 7 7.2 6.1 9.6C5.25 11.75 5.5 14.1 6.1 15.9C6.7 17.4 8.1 18.05 10 18C10.7 17.97 11.4 17.8 12 17.55Z";
const BRAIN_RIGHT_HALF =
  "M12 5.75C14.8 5.55 17 7.2 17.9 9.6C18.75 11.75 18.5 14.1 17.9 15.9C17.3 17.4 15.9 18.05 14 18C13.3 17.97 12.6 17.8 12 17.55Z";

export function BrandLogo({
  className,
  left = LOGO_LEFT,
  right = LOGO_RIGHT,
}: {
  className?: string;
  left?: string;
  right?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d={BRAIN_LEFT_HALF} fill={left} />
      <path d={BRAIN_RIGHT_HALF} fill={right} />
      <g
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        {BRAIN_PATHS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
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
                ? "bg-black/5 dark:bg-white/10"
                : "text-zinc-600 hover:bg-black/[.03] dark:text-zinc-400 dark:hover:bg-white/[.06]",
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