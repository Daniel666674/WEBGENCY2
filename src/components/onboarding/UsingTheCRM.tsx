import {
  LayoutDashboard, Columns3, Users, Handshake, Activity, ClipboardList,
  Calculator, FileText, UserCheck, FolderKanban, ListChecks, PackageCheck,
  DollarSign, TrendingUp, UserCog, Repeat,
} from "lucide-react";
import { Lead, SectionTitle, SubTitle, Callout, InfoCard } from "./shared";

export function UsingTheCRM() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="space-y-3">
        <SectionTitle>Cómo usar el CRM</SectionTitle>
        <Lead>
          Una vuelta por cada herramienta y para qué sirve. Todo se conecta: un contacto se vuelve
          deal, un deal ganado se vuelve cliente con proyecto y mensualidad. El menú lateral (arriba a
          la izquierda) tiene todo.
        </Lead>
      </div>

      <div>
        <SubTitle>Ventas del día a día</SubTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <InfoCard title="Dashboard" icon={LayoutDashboard} color="primary">
            La foto del negocio de un vistazo: MRR (ingreso mensual recurrente), clientes activos,
            embudo de ventas, leads calientes, cobros próximos y proyectos activos. Es lo primero que
            se mira cada mañana.
          </InfoCard>
          <InfoCard title="Pipeline" icon={Columns3} color="blue">
            El tablero de ventas. Cada deal es una tarjeta que se arrastra entre etapas (Prospecto →
            Contactado → Propuesta → Negociación → Cerrado). De un vistazo se ve en qué va cada
            negocio y cuánto hay en juego.
          </InfoCard>
          <InfoCard title="Contactos" icon={Users} color="green">
            Todos los prospectos y clientes. Cada uno tiene temperatura (frío/tibio/caliente), score,
            fuente, su mockup, sus deals y su historial. Es la ficha completa de cada negocio.
          </InfoCard>
          <InfoCard title="Deals" icon={Handshake} color="purple">
            Las oportunidades de venta con su valor y probabilidad. Un deal nace de un contacto y vive
            en el pipeline hasta que se gana o se pierde.
          </InfoCard>
          <InfoCard title="Actividades" icon={Activity} color="amber">
            El registro de cada interacción: llamadas, correos, reuniones, notas y follow-ups. Los
            follow-ups pendientes avisan en el dashboard para que no se caiga ningún cliente.
          </InfoCard>
          <InfoCard title="Tareas" icon={ClipboardList} color="red">
            Tablero Kanban del equipo (Pendientes/En progreso/En revisión/Completadas/Vencidas), con
            calendario, prioridades y actividad por tarea. Se puede arrastrar entre columnas.
          </InfoCard>
        </div>
      </div>

      <div>
        <SubTitle>Precios y propuestas</SubTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoCard title="Calculadora" icon={Calculator} color="primary">
            El corazón de la cotización. Se elige el plan base, se le suman módulos, mantenimiento y
            community manager, se define permanencia y forma de pago — y arma el precio con IVA
            automáticamente. Nunca cotizar &quot;a ojo&quot;: siempre con la calculadora.
          </InfoCard>
          <InfoCard title="Propuestas" icon={FileText} color="blue">
            Convierte una cotización en un documento profesional que se comparte con el cliente por un
            enlace. El CRM avisa cuándo el cliente la abrió. De ahí se convierte en proyecto al cerrar.
          </InfoCard>
        </div>
      </div>

      <div>
        <SubTitle>Después del cierre (cuentas activas)</SubTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <InfoCard title="Clientes Activos" icon={UserCheck} color="green">
            Los negocios que ya pagan. Aquí se ve su mensualidad, su próximo cobro y su estado. Es la
            base del ingreso recurrente.
          </InfoCard>
          <InfoCard title="Proyectos" icon={FolderKanban} color="purple">
            El trabajo en ejecución para cada cliente: estado, presupuesto, deadline e hitos
            (milestones). Así se sabe qué se está construyendo y cómo va.
          </InfoCard>
          <InfoCard title="Tareas y Solicitudes" icon={ListChecks} color="amber">
            Tareas del equipo y solicitudes de los clientes, asignables a Daniel o Daniela. Cada quien
            ve lo suyo y el estado se actualiza en tiempo real para los dos.
          </InfoCard>
          <InfoCard title="Entregables" icon={PackageCheck} color="red">
            Lo que se le entrega al cliente (accesos, manuales, archivos). Deja registro de qué se
            entregó y cuándo se aprobó.
          </InfoCard>
        </div>
      </div>

      <div>
        <SubTitle>Ingresos y proyección</SubTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoCard title="Revenue" icon={DollarSign} color="green">
            El dinero real: ingresos únicos + mensualidades, por cliente y en total. La verdad de cómo
            va el negocio.
          </InfoCard>
          <InfoCard title="Forecast" icon={TrendingUp} color="blue">
            La proyección: cuánto se espera cerrar según el pipeline y cuánto MRR se acumula hacia
            adelante. Sirve para tomar decisiones con números, no con corazonadas.
          </InfoCard>
        </div>
      </div>

      <Callout tone="primary" icon={UserCog} title="Cambiar entre Daniel y Daniela">
        <p>
          Arriba a la derecha está el selector de usuario. Cada quien entra con su propio usuario y
          contraseña, y el CRM lo reconoce automáticamente. Al asignar tareas o registrar actividad,
          queda claro quién hizo qué — pero <strong>los dos ven y pueden mover todo</strong>, porque el
          negocio es 50/50.
        </p>
      </Callout>

      <Callout tone="green" icon={Repeat} title="La rutina ganadora">
        <p>
          Cada día: revisar el Dashboard, atender los follow-ups pendientes, mover los deals del
          Pipeline, y meter al menos un prospecto nuevo. Cada semana: revisar Revenue y Forecast juntos.
          El CRM solo funciona si se alimenta — si pasó algo con un cliente, va al CRM.
        </p>
      </Callout>
    </div>
  );
}
