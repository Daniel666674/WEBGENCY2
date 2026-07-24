import { Star, Quote, Search, MessageCircle, Monitor, Calculator, Handshake, UserCheck, DollarSign, BarChart3, Target, Rocket, Users, TrendingUp, Heart } from "lucide-react";
import { Lead, SectionTitle, Callout, InfoCard, FlowSteps, Banner, SubTitle } from "./shared";

export function WhatIsOliwan() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr] lg:items-start">
        <div className="space-y-3">
          <SectionTitle>Qué es OLIWAN y por qué existe</SectionTitle>
          <Lead>
            OLIWAN es una agencia digital: le construimos a negocios reales su presencia en internet —
            sitios web, tiendas en línea, automatizaciones e IA — para que vendan más y trabajen menos.
            No vendemos &quot;páginas&quot;; vendemos que un negocio deje de perder clientes por no estar
            bien montado en digital.
          </Lead>
          <Lead>
            Este CRM es el motor interno del negocio. Aquí vive todo: los prospectos, el pipeline de
            ventas, las propuestas, los precios, los clientes activos, sus pagos y las tareas del equipo.
            Es la única fuente de verdad — si no está en el CRM, no existe.
          </Lead>
        </div>

        <Callout tone="primary" icon={Star} title="Sociedad 50/50">
          <p>
            OLIWAN es de Daniel y Daniela por partes iguales: <strong>50/50 en decisiones y 50/50 en
            ganancias</strong>. Ninguna decisión importante — precios, contrataciones, en qué clientes
            enfocarnos, cómo se reparte la plata — se toma sin los dos de acuerdo. Este CRM refleja eso:
            los dos ven todo, los dos pueden mover todo.
          </p>
        </Callout>
      </div>

      <Callout tone="green" icon={Quote} title="El modelo en una frase">
        <p>
          <strong>Le mostramos al negocio su propia web ya hecha, antes de que pague.</strong> En vez
          de convencer con palabras, construimos un <em>mockup</em> real con su marca, sus productos y
          sus fotos. Cuando el dueño ve su negocio hecho realidad, la venta se cierra sola.
        </p>
      </Callout>

      <div>
        <SubTitle>Cómo fluye un negocio, de principio a fin</SubTitle>
        <FlowSteps
          items={[
            { title: "Detectar", icon: Search, body: "Encontramos un negocio con buen producto pero mala (o nula) presencia digital. Ver la pestaña 'Encontrar negocios'." },
            { title: "Contactar y pedir material", icon: MessageCircle, body: "Le escribimos y pedimos su logo y algunas fotos/videos de sus redes — con la excusa de 'mostrarle una idea'. Bajo compromiso." },
            { title: "Construir el mockup", icon: Monitor, body: "Armamos una muestra real de su sitio con su marca. Ese mockup es nuestra mejor arma de venta." },
            { title: "Presentar y cotizar", icon: Calculator, body: "Le mostramos el mockup, usamos la Calculadora para armar el precio y generamos una Propuesta profesional." },
            { title: "Cerrar", icon: Handshake, body: "Movemos el deal por el Pipeline hasta 'Cerrado Ganado'. Se define forma de pago y permanencia." },
            { title: "Entregar y mantener", icon: UserCheck, body: "Pasa a ser Cliente Activo: proyecto, tareas, entregables y una mensualidad de mantenimiento que genera ingresos recurrentes (MRR)." },
          ]}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <InfoCard
          title="Ingreso único"
          icon={DollarSign}
          color="green"
          listLabel="Ejemplos"
          items={["Sitio web corporativo", "Tienda en línea", "Automatización/IA"]}
        >
          El pago del proyecto (armar el sitio/sistema). Es el grueso inicial, pero pasa una sola vez.
        </InfoCard>
        <InfoCard
          title="Ingreso recurrente (MRR)"
          icon={BarChart3}
          color="purple"
          listLabel="Incluye"
          items={["Hosting, backups y seguridad", "Actualizaciones y soporte", "Mejoras continuas", "Pequeñas automatizaciones"]}
        >
          La mensualidad de mantenimiento y servicios. Es lo que hace el negocio sólido y predecible.
        </InfoCard>
        <InfoCard
          title="La meta"
          icon={Target}
          color="blue"
          listLabel="Por eso"
          items={["Detectamos sin parar", "Entregamos excelente", "Cuidamos la churn (retención)"]}
        >
          Un flujo constante de clientes nuevos + una base creciente de mensualidades que se acumulan mes a mes.
        </InfoCard>
      </div>

      <Banner
        icon={Rocket}
        label="Recuerda:"
        highlights={[
          { icon: Users, label: "Negocio digital bien hecho" },
          { icon: TrendingUp, label: "Ingresos recurrentes" },
          { icon: Heart, label: "Clientes felices y que se quedan" },
        ]}
      >
        No vendemos páginas. Vendemos <strong className="text-primary">crecimiento y tranquilidad</strong>.
      </Banner>
    </div>
  );
}
