import { formatCurrency } from "@/lib/constants";
import {
  BASE_TIERS,
  ADDON_MODULES,
  MAINTENANCE_TIERS,
  COMMUNITY_MANAGER_TIERS,
  CONTRACT_TERMS,
  PAYMENT_SCHEDULES,
  MODULE_CATEGORY_LABELS,
  IVA_RATE,
  type ModuleCategory,
} from "@/lib/catalog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lead, SectionTitle, SubTitle, Callout, CheckList } from "./shared";

const CATEGORY_ORDER: ModuleCategory[] = [
  "catalogo", "automatizacion", "marketing", "seo", "acceso", "diseno", "pagos",
];

export function Training() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div className="space-y-3">
        <SectionTitle>Qué vendemos</SectionTitle>
        <Lead>
          Todo lo de abajo son precios <strong>reales</strong>, sacados de las propuestas que ya
          cerramos (Stike, ESCENA, PROTECTAPPF, Skinny Boy, Real Comfort, Alivia, Cobra Repuestos,
          Parra Shop). Los valores están en pesos colombianos. Al cliente siempre se le suma
          IVA del {Math.round(IVA_RATE * 100)}%. La Calculadora arma todo esto automáticamente.
        </Lead>
      </div>

      {/* Planes base */}
      <div>
        <SubTitle>1. Planes base (pago único)</SubTitle>
        <p className="text-sm text-muted-foreground mb-3">
          El punto de partida. Se elige uno según el tamaño del negocio y luego se le suman módulos.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          {BASE_TIERS.map((t) => (
            <Card key={t.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold">{t.name}</h4>
                  <Badge variant="outline" className="shrink-0">{t.track === "custom" ? "A medida" : "Web"}</Badge>
                </div>
                <p className="text-lg font-bold text-primary">{formatCurrency(t.oneTimeFee)}</p>
                <p className="text-sm text-muted-foreground">{t.description}</p>
                <CheckList items={t.features} />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Módulos / add-ons */}
      <div>
        <SubTitle>2. Módulos adicionales</SubTitle>
        <p className="text-sm text-muted-foreground mb-3">
          Se agregan al plan base según lo que el negocio necesite. Aquí es donde sube el ticket y
          donde nacen las mensualidades. Algunos tienen pago único, otros pago único + mensualidad.
        </p>
        <div className="space-y-4">
          {CATEGORY_ORDER.map((cat) => {
            const mods = ADDON_MODULES.filter((m) => m.category === cat);
            if (mods.length === 0) return null;
            return (
              <div key={cat}>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary/80 mb-1.5">
                  {MODULE_CATEGORY_LABELS[cat]}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {mods.map((m) => (
                    <div key={m.id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm">{m.name}</p>
                        <p className="text-xs font-semibold text-primary shrink-0 text-right">
                          {m.oneTimeFee > 0 && formatCurrency(m.oneTimeFee)}
                          {m.monthlyFee ? (
                            <span className="block text-muted-foreground font-normal">
                              +{formatCurrency(m.monthlyFee)}/mes
                            </span>
                          ) : null}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{m.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mantenimiento */}
      <div>
        <SubTitle>3. Mantenimiento (mensualidad recurrente)</SubTitle>
        <p className="text-sm text-muted-foreground mb-3">
          Casi todo cliente se lleva un plan de mantenimiento. <strong>Esto es el MRR</strong>: el
          ingreso que se repite cada mes y hace crecer el negocio de forma sólida.
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          {MAINTENANCE_TIERS.map((m) => (
            <Card key={m.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm">{m.name}</h4>
                  {m.recommended && <Badge className="shrink-0">Recomendado</Badge>}
                </div>
                <p className="text-base font-bold text-primary">{formatCurrency(m.monthlyFee)}/mes</p>
                <CheckList items={m.features} />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Community manager */}
      <div>
        <SubTitle>4. Community Manager (contenido y redes)</SubTitle>
        <p className="text-sm text-muted-foreground mb-3">
          Servicio mensual aparte: producción y publicación de contenido para las redes del cliente.
          Es otra mensualidad, distinta del mantenimiento técnico.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          {COMMUNITY_MANAGER_TIERS.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4 space-y-2">
                <h4 className="font-bold text-sm">{c.name}</h4>
                <p className="text-xs text-muted-foreground italic">{c.tagline}</p>
                <p className="text-base font-bold text-primary">
                  {formatCurrency(c.monthlyFeeMin)} – {formatCurrency(c.monthlyFeeMax)}/mes
                </p>
                <CheckList items={c.features} />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Términos y pago */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <SubTitle>5. Permanencia (descuento por compromiso)</SubTitle>
          <div className="space-y-2">
            {CONTRACT_TERMS.map((t) => (
              <div key={t.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{t.name}</p>
                  {t.discountPct > 0 && <Badge variant="outline">-{t.discountPct}%</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <SubTitle>6. Forma de pago del proyecto</SubTitle>
          <div className="space-y-2">
            {PAYMENT_SCHEDULES.map((p) => (
              <div key={p.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{p.name}</p>
                  {p.discountPct ? <Badge variant="outline">-{p.discountPct}%</Badge> : null}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Callout tone="amber" title="Reglas de oro al cotizar">
        <CheckList
          items={[
            "Siempre empujar hacia una mensualidad (mantenimiento y/o community manager): eso es lo que construye el negocio.",
            "El IVA del 19% va aparte y siempre se menciona: nunca sorprender al cliente con el total final.",
            "El descuento por pago completo o por permanencia es una herramienta de cierre — úsalo para mover al cliente indeciso.",
            "Nunca inventar precios: si algo no está en la Calculadora, se cotiza con base en un caso real parecido y se consulta entre los dos.",
          ]}
        />
      </Callout>
    </div>
  );
}
