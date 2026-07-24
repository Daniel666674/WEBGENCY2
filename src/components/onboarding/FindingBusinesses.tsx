import { Lead, SectionTitle, SubTitle, Callout, InfoCard, CheckList } from "./shared";

export function FindingBusinesses() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="space-y-3">
        <SectionTitle>Cómo encontrar negocios (las señales)</SectionTitle>
        <Lead>
          No buscamos cualquier negocio: buscamos negocios con <strong>buen producto y mala presencia
          digital</strong>. Esos son los que más rápido ven el valor y más rápido pagan. Estas son las
          señales concretas que nos dicen &quot;este es un buen prospecto&quot;.
        </Lead>
      </div>

      <div>
        <SubTitle>Señales verdes — vale la pena contactar</SubTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoCard title="Vende bien por redes, pero no tiene web" accent="#16a34a">
            Instagram/TikTok/WhatsApp activos, pedidos por DM, pero sin sitio propio donde comprar. El
            dolor es claro y la solución obvia.
          </InfoCard>
          <InfoCard title="Web vieja, lenta o que no sirve en el celular" accent="#16a34a">
            Tienen sitio pero se ve de hace 10 años, carga lento o se ve roto en móvil. Rediseño listo.
          </InfoCard>
          <InfoCard title="Catálogo desordenado en redes" accent="#16a34a">
            Precios en los comentarios, &quot;escríbenos al DM&quot;, stock que nadie sabe. Candidato a
            catálogo + pedidos automáticos.
          </InfoCard>
          <InfoCard title="Toman pedidos a mano por WhatsApp" accent="#16a34a">
            Todo el negocio depende de responder mensajes uno por uno. Pierden ventas cuando no
            alcanzan. Automatización + tienda resuelven eso.
          </InfoCard>
          <InfoCard title="Invierten en pauta pero mandan el tráfico a un perfil" accent="#16a34a">
            Ya gastan en ads (señal de que tienen plata y mentalidad de crecer), pero el tráfico cae en
            un Instagram que no convierte, no en un sitio que vende.
          </InfoCard>
          <InfoCard title="Sin dominio ni Google" accent="#16a34a">
            Usan Linktree, un .wixsite o nada. No aparecen en Google Maps ni tienen Google Business.
            Invisibles para quien los busca.
          </InfoCard>
          <InfoCard title="Negocio establecido pero cero digital" accent="#16a34a">
            Años operando, clientela fiel, buen producto — pero atrasados en lo digital. Confían en lo
            que venden y están listos para profesionalizarse.
          </InfoCard>
          <InfoCard title="La competencia ya tiene tienda online" accent="#16a34a">
            Si el vecino ya vende por internet, el prospecto siente que se está quedando atrás. Urgencia
            real de venta.
          </InfoCard>
        </div>
      </div>

      <div>
        <SubTitle>Sectores que ya sabemos que funcionan</SubTitle>
        <CheckList
          items={[
            "Tiendas: bicicletas, ropa, perfumes, repuestos, calzado (Stike, ESCENA, Cobra, Skinny Boy).",
            "Restaurantes, cafés y comida — menú digital, pedidos y reservas.",
            "Clínicas, estética, spa, odontología — citas y recordatorios automáticos.",
            "Inmobiliaria y finca raíz — catálogo de propiedades con filtros.",
            "Gimnasios y fitness — membresías y reserva de clases.",
            "Servicios profesionales (legal, contable) — sistemas a medida, portales y automatización de documentos.",
          ]}
        />
      </div>

      <div>
        <SubTitle>Dónde salir a buscarlos</SubTitle>
        <CheckList
          items={[
            "Instagram y TikTok por hashtags y ubicación local (negocios con seguidores pero sin link a un sitio real).",
            "Google Maps: negocios sin sitio web listado o con reseñas buenas pero sin presencia online.",
            "Referidos de clientes actuales — el canal más fácil de cerrar.",
            "Marketplaces (Mercado Libre): vendedores con buen volumen pero sin marca propia.",
            "Ferias, eventos y plazas locales — negocios físicos con producto fuerte.",
          ]}
        />
      </div>

      <Callout tone="red" title="Señales rojas — no perder el tiempo">
        <CheckList
          items={[
            "No tienen un producto o servicio real que vender.",
            "No tienen con qué pagar, o piden todo 'gratis a ver si funciona'.",
            "Quieren decidir 'con el primo que sabe de computadores'.",
            "Regatean el valor antes de ver el mockup — señal de que nunca van a valorar el trabajo.",
          ]}
        />
      </Callout>

      <Callout tone="primary" title="La prueba de fuego">
        <p>
          Antes de invertir tiempo en un mockup, pregúntate: <strong>¿este negocio tiene buen producto,
          capacidad de pagar, y un dolor real que nuestro sitio resuelve?</strong> Si las tres son sí,
          adelante. Si falta una, sigue buscando.
        </p>
      </Callout>
    </div>
  );
}
