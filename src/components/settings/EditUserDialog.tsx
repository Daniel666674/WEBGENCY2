"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { AppUser } from "@/context/UserContext";

const COLOR_PRESETS = ["#0d9a8a", "#2563eb", "#e879a0", "#f59e0b", "#8b5cf6", "#ef4444", "#16a34a"];

export function EditUserDialog({
  user,
  open,
  onClose,
  onSaved,
}: {
  user: AppUser | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#0d9a8a");
  const [avatar, setAvatar] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setColor(user.color);
      setAvatar(user.avatar ?? "");
    }
  }, [user]);

  async function handleSave() {
    if (!user || !name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), color, avatar: avatar.trim() || name.trim()[0] }),
      });
      if (!res.ok) throw new Error();
      toast.success("Perfil actualizado");
      onSaved();
      onClose();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Editar perfil</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
              style={{ backgroundColor: color }}
            >
              {avatar || name[0] || "?"}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-name">Nombre</Label>
            <Input id="user-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-avatar">Iniciales / emoji</Label>
            <Input
              id="user-avatar"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="D"
              maxLength={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full border-2 transition-transform cursor-pointer"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? "var(--foreground)" : "transparent",
                    transform: color === c ? "scale(1.1)" : "scale(1)",
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="cursor-pointer">
              Cancelar
            </Button>
            <Button type="button" onClick={handleSave} disabled={saving || !name.trim()} className="cursor-pointer">
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
