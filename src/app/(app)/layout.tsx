"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SidebarNav } from "@/components/sidebar-nav";
import {
  Sheet, SheetContent, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { api } from "@/lib/api";

const subscribe = () => () => {};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("refresh_token")) {
      router.push("/login");
    }
  }, [router]);

  if (!mounted) return null;

  async function handleLogout() {
    await api.logout();
    router.push("/login");
  }

  return (
    <div className="flex min-h-full">
      <aside className="hidden w-64 shrink-0 flex-col gap-6 border-r border-black/10 p-4 dark:border-white/10 md:flex">
        <Link href="/dashboard" className="px-3 text-lg font-semibold tracking-tight">
          Knovolve
        </Link>
        <SidebarNav />
        <div className="mt-auto">
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            Log out
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-black/10 px-4 md:hidden dark:border-white/10">
          <span className="text-lg font-semibold tracking-tight">Knovolve</span>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger render={<Button variant="outline" size="sm">Menu</Button>} />
            <SheetContent side="left">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="flex flex-col gap-6 p-4">
                <SidebarNav onNavigate={() => setSheetOpen(false)} />
                <Button variant="outline" onClick={() => { setSheetOpen(false); handleLogout(); }}>
                  Log out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
