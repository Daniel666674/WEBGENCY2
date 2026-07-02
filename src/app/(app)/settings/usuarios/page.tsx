"use client";

import { useState } from "react";
import { useUser, type AppUser } from "@/context/UserContext";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Pencil } from "lucide-react";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { EditUserDialog } from "@/components/settings/EditUserDialog";

export default function UsuariosPage() {
  const { users, loading, refetchUsers } = useUser();
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <SettingsHeader icon={Users} title="Usuarios" description="Gestiona los usuarios del equipo." />

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : (
            <div className="space-y-2">
              {users.map((u) => (
                <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg border">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                    style={{ backgroundColor: u.color }}
                  >
                    {u.avatar ?? u.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.isHers ? "Miembro" : "Admin"}</p>
                  </div>
                  <button
                    onClick={() => setEditingUser(u)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium hover:bg-muted transition-colors cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-4">
            Solo 2 cuentas — cuando se active el login con Google, cada una se vincula a una cuenta real.
          </p>
        </CardContent>
      </Card>

      <EditUserDialog
        user={editingUser}
        open={!!editingUser}
        onClose={() => setEditingUser(null)}
        onSaved={refetchUsers}
      />
    </div>
  );
}
