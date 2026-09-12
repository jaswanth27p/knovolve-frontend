"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { BrandLogo, SidebarNav } from "@/components/sidebar-nav";
import { FloatingChatbot } from "@/components/floating-chatbot";
import {
  Sheet, SheetContent, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { api } from "@/lib/api";
import { clearAuthTracking } from "@/lib/tracked-job";
import { LogOut, Menu, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const subscribe = () => () => {};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!api.isLoggedIn()) {
      router.push("/login");
    }
  }, [router]);

  if (!mounted) return null;

  async function handleLogout() {
    await api.logout();
    // Cache is keyed by resource id, not user id — without this the next
    // account to log in briefly sees the previous account's cached data
    // (dashboard stats, courses) until each query refetches.
    queryClient.clear();
    clearAuthTracking();
    router.push("/login");
  }

  return (
    <>
    <div className="flex min-h-dvh">
      <aside
        className={cn(
          "relative hidden shrink-0 flex-col border-r border-black/10 dark:border-white/10 md:flex",
          collapsed ? "w-16" : "w-64",
          "h-dvh sticky top-0"
        )}
      >
        <div className="relative flex h-14 shrink-0 items-center border-b border-black/10 px-3 dark:border-white/10">
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-2.5 font-semibold tracking-tight",
              collapsed ? "justify-center w-full" : "px-1"
            )}
            title={collapsed ? "Knovolve" : undefined}
          >
            <BrandLogo className="size-7 shrink-0" />
            {!collapsed && <span className="text-lg">Knovolve</span>}
          </Link>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="absolute -right-4 -bottom-4 z-10 rounded-full bg-background shadow-md"
          >
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <SidebarNav collapsed={collapsed} />
        </div>
        <div className="mt-auto shrink-0 border-t border-black/10 p-3 dark:border-white/10">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={cn("w-full gap-2.5", collapsed && "justify-center px-0")}
            title={collapsed ? "Log out" : undefined}
          >
            <LogOut className="size-4 shrink-0" />
            {!collapsed && <span>Log out</span>}
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-black/10 px-4 md:hidden dark:border-white/10">
          <Link href="/dashboard" className="flex items-center gap-2">
            <BrandLogo className="size-7 text-foreground" />
            <span className="text-lg font-semibold tracking-tight">Knovolve</span>
          </Link>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Open navigation menu"><Menu /></Button>} />
            <SheetContent side="left">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="flex h-full flex-col p-4">
                <div className="flex items-center gap-2 px-1 pb-4">
                  <BrandLogo className="size-8 text-foreground" />
                  <span className="text-lg font-semibold tracking-tight">Knovolve</span>
                </div>
                <SidebarNav onNavigate={() => setSheetOpen(false)} />
                <div className="mt-auto pt-4">
                  <Button variant="ghost" onClick={() => { setSheetOpen(false); handleLogout(); }}>
                    <LogOut /> Log out
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </div>
    <FloatingChatbot />
    </>
  );
}
