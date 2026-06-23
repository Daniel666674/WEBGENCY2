"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Phone, Mail, Users, FileText, AlertCircle } from "lucide-react";

interface FollowUp {
  id: string;
  type: string;
  description: string;
  contactName?: string;
  scheduledAt: string | number | null;
}

const typeIcons: Record<string, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: Users,
  note: FileText,
  follow_up: Clock,
};

export function AgendaToday() {
  const [overdue, setOverdue] = useState<FollowUp[]>([]);
  const [today, setToday] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/followups")
      .then((r) => r.json())
      .then((data) => {
        setOverdue(data.overdue || []);
        setToday(data.today || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agenda de Hoy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const items = [...overdue, ...today];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Agenda de Hoy</CardTitle>
        {overdue.length > 0 && (
          <Badge variant="destructive" className="text-xs">
            {overdue.length} vencidos
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Sin actividades pendientes
          </p>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {items.map((item) => {
              const Icon = typeIcons[item.type] || FileText;
              const isOverdue = overdue.includes(item);
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-2.5 rounded-lg border ${
                    isOverdue ? "border-red-200 bg-red-50/50" : "border-border"
                  }`}
                >
                  <div className={`rounded-full p-1.5 ${isOverdue ? "bg-red-100" : "bg-muted"}`}>
                    {isOverdue ? (
                      <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                    ) : (
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.contactName && (
                        <span className={isOverdue ? "text-red-700" : "text-primary"}>
                          {item.contactName}
                        </span>
                      )}
                      {item.contactName && " — "}
                      <Badge variant="secondary" className="text-[10px] ml-1">
                        {item.type === "follow_up" ? "Follow-up" : item.type}
                      </Badge>
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
