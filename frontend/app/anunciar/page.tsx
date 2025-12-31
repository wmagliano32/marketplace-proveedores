import Link from "next/link";
import Container from "@/components/Container";

const PRICES = {
  HEADER: 100000,
  LEFT_RAIL: 80000,
  RIGHT_RAIL: 80000,
  FOOTER: 50000,
};

function money(v: number) {
  return v.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

export default function AnunciarPage() {
  return (
    <main>
      <Container>
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-semibold tracking-tight">Anunciá tu negocio</h1>
          <p className="mt-2 text-slate-600">
            Elegí ubicación, subí tu banner o armá uno con logo + colores + texto. Luego lo aprobamos y lo publicamos.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {[
              { key: "HEADER", title: "Header", desc: "Banner horizontal (ideal para marca)", hint: "Recomendado: 970×90 o 1200×120" },
              { key: "LEFT_RAIL", title: "Lateral izquierdo", desc: "Skyscraper en pantallas grandes", hint: "Recomendado: 180×600" },
              { key: "RIGHT_RAIL", title: "Lateral derecho", desc: "Skyscraper en pantallas grandes", hint: "Recomendado: 180×600" },
              { key: "FOOTER", title: "Footer", desc: "Banner al final del sitio", hint: "Recomendado: 970×90" },
            ].map((p) => (
              <div key={p.key} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-sm text-slate-500">{p.title}</div>
                <div className="mt-1 text-2xl font-semibold">{money((PRICES as any)[p.key])}/mes</div>
                <div className="mt-2 text-sm text-slate-700">{p.desc}</div>
                <div className="mt-1 text-xs text-slate-500">{p.hint}</div>

                <Link
                  href={`/anunciar/solicitud?placement=${encodeURIComponent(p.key)}`}
                  className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                >
                  Solicitar anuncio
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Cómo funciona</h2>
            <ol className="mt-3 list-decimal pl-5 text-sm text-slate-700 space-y-2">
              <li>Elegís ubicación y duración.</li>
              <li>Subís tu banner (o armás uno con logo + color + texto).</li>
              <li>Revisamos y lo publicamos.</li>
              <li>Luego te enviamos link de pago (y más adelante lo automatizamos con Mercado Pago).</li>
            </ol>

            <div className="mt-4">
              <Link className="text-sm underline text-slate-700 hover:text-slate-900" href="/buscar">
                Volver al directorio →
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}
