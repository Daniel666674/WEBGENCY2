import { Lead, SectionTitle, SubTitle, Callout, InfoCard, CheckList, Steps } from "./shared";

export function MockupProcess() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="space-y-3">
        <SectionTitle>Cómo construimos el mockup</SectionTitle>
        <Lead>
          El mockup es nuestra mejor arma de venta. En vez de describir lo que haríamos, le mostramos
          al dueño <strong>su propio negocio ya convertido en un sitio real</strong>. Cuando lo ve, deja
          de ser un gasto y se vuelve algo que ya quiere tener.
        </Lead>
      </div>

      <Callout tone="primary" title="Por qué funciona">
        <p>
          Es la diferencia entre &quot;te podemos hacer una página&quot; y &quot;mira, así se vería tu
          tienda&quot;. Lo segundo elimina la imaginación y el riesgo para el cliente: ya lo está viendo.
          Por eso pedimos el material <em>antes</em> de cotizar.
        </p>
      </Callout>

      <div>
        <SubTitle>Qué necesitamos del prospecto</SubTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoCard title="Logo">
            Su logo en la mejor calidad que tengan. Si no tienen o está feo, lo recreamos — pero pedirlo
            abre la conversación.
          </InfoCard>
          <InfoCard title="Fotos de sus redes">
            Fotos de productos, del local, del equipo. Las sacamos de su Instagram/Facebook si hace
            falta, pero es mejor pedirlas: participa y se compromete.
          </InfoCard>
          <InfoCard title="Videos y reels">
            Videos que ya tengan en redes — sirven para darle vida al sitio y para el contenido. También
            nos dicen el tono y el estilo de la marca.
          </InfoCard>
          <InfoCard title="Productos y precios">
            Una idea de qué venden y a qué precio, aunque sea aproximado. Con eso el mockup se siente
            real, no genérico.
          </InfoCard>
          <InfoCard title="Colores e identidad">
            Si tienen colores de marca o una estética definida, la respetamos. Si no, la proponemos
            nosotros a partir de su logo.
          </InfoCard>
          <InfoCard title="Redes sociales">
            Sus perfiles (Instagram, Facebook, TikTok, WhatsApp) para conectarlos al sitio y entender
            cómo se comunican hoy.
          </InfoCard>
        </div>
      </div>

      <Callout tone="green" title="Cómo pedirlo sin fricción">
        <p>
          La clave es que sea <strong>de bajo compromiso</strong>. No pedimos que compren nada — pedimos
          material &quot;para mostrarles una idea&quot;. Un mensaje que funciona:
        </p>
        <p className="italic border-l-2 border-green-500/40 pl-3 mt-1">
          &quot;Hola, vi su negocio y me encantó lo que hacen. Estoy armando una idea de cómo se vería
          su tienda online y quería mostrársela. ¿Me pueden pasar su logo y unas fotos de sus
          productos? Sin compromiso, es solo para que vean el concepto.&quot;
        </p>
      </Callout>

      <div>
        <SubTitle>Del mockup al cierre — en el CRM</SubTitle>
        <Steps
          items={[
            { title: "Crear el contacto", body: "Se agrega el prospecto en Contactos con su fuente (Instagram, referido, etc.) y sus notas." },
            { title: "Construir y subir el mockup", body: "Se arma la muestra y se guarda su enlace (mockupUrl) en el contacto. El dashboard resalta los mockups listos sin enviar." },
            { title: "Presentarlo y crear el deal", body: "Se le muestra al cliente y se crea un Deal en el Pipeline, moviéndolo a la etapa 'Propuesta'." },
            { title: "Cotizar con la Calculadora", body: "Se arma el precio real con plan base + módulos + mensualidad, y se genera una Propuesta." },
            { title: "Cerrar y activar", body: "Al aceptar, el deal pasa a 'Cerrado Ganado' y el contacto se vuelve Cliente Activo con su mensualidad." },
          ]}
        />
      </div>

      <Callout tone="amber" title="Regla">
        <p>
          Un mockup solo se construye para un prospecto que pasó la prueba de fuego (buen producto,
          capacidad de pago, dolor real). Construir mockups para cualquiera quema tiempo que es de los
          dos — se decide con criterio.
        </p>
      </Callout>
    </div>
  );
}
