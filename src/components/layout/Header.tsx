"use client";

import { useState } from "react";
import { Search, Bell, Menu } from "lucide-react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MobileNav } from "./MobileNav";
import { UserSwitcher } from "@/components/user/UserSwitcher";

export function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6">
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger
          render={<Button variant="ghost" size="icon" className="md:hidden cursor-pointer" />}
        >
          <Menu className="h-5 w-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <MobileNav onNavigate={() => setSheetOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="hidden md:flex items-center gap-2 mr-2">
        <div className="relative shrink-0">
          <div
            className="absolute inset-0 rounded-md blur-sm opacity-50"
            style={{ backgroundColor: "var(--primary)", animation: "oliwan-pulse 3.2s ease-in-out infinite" }}
          />
          <Image src="/logo.png" alt="OLIWAN" width={30} height={30} className="relative rounded-md" />
        </div>
        <span className="text-sm font-bold tracking-tight hidden lg:block">OLIWAN</span>
      </div>

      <div className="flex-1 flex items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar contactos, deals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-muted/50"
          />
        </div>
      </div>

      <UserSwitcher />

      <Button variant="ghost" size="icon" className="relative cursor-pointer">
        <Bell className="h-5 w-5" />
      </Button>
    </header>
  );
}
