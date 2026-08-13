"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { PermissionPicker } from "./PermissionPicker";

export function InviteUserDialog({
  open,
  onClose,
  onInvited,
}: {
  open: boolean;
  onClose: () => void;
  onInvited: () => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"owner" | "member">("member");
  const [perms, setPerms] = useState<string[]>(["dashboard"]);
  const [inviting, setInviting] = useState(false);

  function reset() {
    setEmail("");
    setRole("member");
    setPerms(["dashboard"]);
  }

  async function invite() {
    const clean = email.trim().toLowerCase();
    if (!clean || !clean.includes("@")) {
      toast.error("Email invalido");
      return;
    }
    setInviting(true);
    try {
      const res = await fetch("/api/allowed-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: clean, role, permissions: perms }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Error"); return; }
      toast.success("Usuario invitado — ya puede iniciar sesion con Google");
      reset();
      onInvited();
      onClose();
    } catch {
      toast.error("Error al invitar");
    } finally {
      setInviting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invitar usuario</DialogTitle>
          <DialogDescription>
            Se agrega a la lista de acceso — puede iniciar sesion con su cuenta de Google apenas lo invites.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            type="email"
            placeholder="email@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input type="radio" checked={role === "member"} onChange={() => setRole("member")} />
              Miembro
            </label>
            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input type="radio" checked={role === "owner"} onChange={() => setRole("owner")} />
              Owner (acceso total)
            </label>
          </div>

          {role === "member" && <PermissionPicker value={perms} onChange={setPerms} />}

          <Button onClick={invite} disabled={inviting || !email.trim()} className="w-full cursor-pointer">
            {inviting ? "Invitando..." : "Invitar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
