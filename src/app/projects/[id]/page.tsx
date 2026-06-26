"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { MilestoneTimeline } from "@/components/projects/MilestoneTimeline";
import { PaymentHistory } from "@/components/projects/PaymentHistory";
import { AttachmentsTab } from "@/components/contacts/AttachmentsTab";
import { PROJECT_STATUS_CONFIG } from "@/components/projects/ProjectCard";
import { formatCurrency } from "@/lib/constants";
import {
  ArrowLeft, FolderKanban, Calendar, ExternalLink,
  Plus, Milestone, CreditCard, Edit2, Check, X, Paperclip
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STATUSES = ["discovery", "design", "dev", "launched", "paused"] as const;

interface Deliverable {
  id: string;
  description: string;
  fileUrl?: string | null;
  approvedAt?: Date | number | null;
  approvedByUserId?: string | null;
}

interface MilestoneData {
  id: string;
  title: string;
  order: number;
  dueDate?: Date | number | null;
  completedAt?: Date | number | null;
  deliverables: Deliverable[];
}

interface ProjectDetail {
  id: string;
  name: string;
  status: string;
  budgetCents: number;
  startDate?: number | null;
  deadline?: number | null;
  mockupUrl?: string | null;
  notes?: string | null;
  clientId?: string | null;
  clientName?: string | null;
  clientCompany?: string | null;
  milestones: MilestoneData[];
}

type Tab = "milestones" | "payments" | "attachments" | "notes";

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [tab, setTab] = useState<Tab>("milestones");
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState("");
  const [newMilestone, setNewMilestone] = useState("");
  const [addingMilestone, setAddingMilestone] = useState(false);

  async function load() {
    const res = await fetch(`/api/projects/${id}`);
    if (!res.ok) { router.push("/projects"); return; }
    const data = await res.json();
    setProject(data);
    setNameVal(data.name);
  }

  useEffect(() => { load(); }, [id]);

  async function updateStatus(status: string) {
    await fetch(`/api/projects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function saveName() {
    if (!nameVal.trim()) return;
    await fetch(`/api/projects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nameVal.trim() }),
    });
    setEditingName(false);
    load();
  }

  async function addMilestone() {
    if (!newMilestone.trim()) return;
    await fetch(`/api/projects/${id}/milestones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newMilestone.trim() }),
    });
    setNewMilestone(""); setAddingMilestone(false);
    toast.success("Milestone agregado");
    load();
  }

  if (!project) {
    return <div className="text-center py-20 text-muted-foreground text-sm">Cargando...</div>;
  }

  const cfg = PROJECT_STATUS_CONFIG[project.status] ?? PROJECT_STATUS_CONFIG.discovery;
  const deadline = project.deadline ? new Date(project.deadline) : null;
  const milestonesCompleted = project.milestones.filter((m) => m.completedAt).length;
  const progress = project.milestones.length > 0
    ? Math.round((milestonesCompleted / project.milestones.length) * 100)
    : 0;

  const deliverablesDone = project.milestones
    .flatMap((m) => m.deliverables)
    .filter((d) => d.approvedAt).length;
  const deliverablesTotal = project.milestones
    .flatMap((m) => m.deliverables).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back */}
      <button
        onClick={() => router.push("/projects")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Proyectos
      </button>

      {/* Project header card */}
      <div className="bg-card border rounded-xl p-5 space-y-4">
        {/* Name + status */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2 flex-1">
            <FolderKanban className="h-5 w-5 text-primary shrink-0" />
            {editingName ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  autoFocus
                  value={nameVal}
                  onChange={(e) => setNameVal(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false); }}
                  className="flex-1 text-lg font-bold bg-transparent border-b border-primary outline-none"
                />
                <button onClick={saveName} className="text-primary"><Check className="h-4 w-4" /></button>
                <button onClick={() => setEditingName(false)} className="text-muted-foreground"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <h1 className="text-xl font-bold flex items-center gap-2">
                {project.name}
                <button onClick={() => setEditingName(true)} className="text-muted-foreground hover:text-foreground">
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              </h1>
            )}
          </div>

          {/* Status selector */}
          <div className="flex flex-wrap gap-1.5">
            {STATUSES.map((s) => {
              const c = PROJECT_STATUS_CONFIG[s];
              const isActive = project.status === s;
              return (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-full border font-medium transition-all",
                    isActive ? "border-transparent" : "border-transparent opacity-40 hover:opacity-70"
                  )}
                  style={isActive ? { color: c.color, backgroundColor: c.bg } : { color: c.color }}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-6 text-sm">
          {project.clientName && (
            <div>
              <p className="text-xs text-muted-foreground">Cliente</p>
              <p className="font-medium">{project.clientName}</p>
              {project.clientCompany && <p className="text-xs text-muted-foreground">{project.clientCompany}</p>}
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground">Presupuesto</p>
            <p className="font-medium text-primary">{formatCurrency(project.budgetCents)}</p>
          </div>
          {deadline && (
            <div>
              <p className="text-xs text-muted-foreground">Deadline</p>
              <p className="font-medium flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {deadline.toLocaleDateString("es-CO", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
          )}
          {project.mockupUrl && (
            <div>
              <p className="text-xs text-muted-foreground">Mockup</p>
              <a
                href={project.mockupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary flex items-center gap-1 hover:underline"
              >
                Ver mockup <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {project.milestones.length > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{milestonesCompleted}/{project.milestones.length} milestones · {deliverablesDone}/{deliverablesTotal} entregables</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(["milestones", "payments", "attachments", "notes"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5",
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t === "milestones" && <Milestone className="h-4 w-4" />}
            {t === "payments" && <CreditCard className="h-4 w-4" />}
            {t === "attachments" && <Paperclip className="h-4 w-4" />}
            {t === "notes" && <Edit2 className="h-4 w-4" />}
            {t === "milestones" ? "Milestones" : t === "payments" ? "Pagos" : t === "attachments" ? "Archivos" : "Notas"}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "milestones" && (
        <div className="space-y-4">
          {/* Add milestone */}
          {addingMilestone ? (
            <div className="flex items-center gap-2 p-3 border rounded-xl bg-muted/30">
              <input
                autoFocus
                type="text"
                placeholder="Nombre del milestone..."
                value={newMilestone}
                onChange={(e) => setNewMilestone(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addMilestone(); if (e.key === "Escape") setAddingMilestone(false); }}
                className="flex-1 text-sm bg-transparent outline-none"
              />
              <button onClick={addMilestone} className="text-primary"><Check className="h-4 w-4" /></button>
              <button onClick={() => setAddingMilestone(false)} className="text-muted-foreground"><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <button
              onClick={() => setAddingMilestone(true)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground border border-dashed rounded-xl px-4 py-2.5 w-full transition-colors"
            >
              <Plus className="h-4 w-4" /> Agregar milestone
            </button>
          )}

          <MilestoneTimeline milestones={project.milestones} onRefresh={load} />
        </div>
      )}

      {tab === "payments" && project.clientId && (
        <PaymentHistory clientId={project.clientId} />
      )}
      {tab === "payments" && !project.clientId && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Asigna un cliente al proyecto para registrar pagos.
        </p>
      )}

      {tab === "attachments" && (
        <AttachmentsTab projectId={id} />
      )}

      {tab === "notes" && (
        <NotesTab projectId={id} initialNotes={project.notes ?? ""} onSave={load} />
      )}
    </div>
  );
}

function NotesTab({
  projectId,
  initialNotes,
  onSave,
}: {
  projectId: string;
  initialNotes: string;
  onSave: () => void;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await fetch(`/api/projects/${projectId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    setSaving(false);
    toast.success("Notas guardadas");
    onSave();
  }

  return (
    <div className="space-y-3">
      <textarea
        rows={10}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notas internas del proyecto..."
        className="w-full border rounded-xl px-4 py-3 text-sm bg-background resize-none"
      />
      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar notas"}
        </button>
      </div>
    </div>
  );
}
