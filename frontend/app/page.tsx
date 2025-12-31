import Link from "next/link";
import Container from "@/components/Container";
import { api } from "@/lib/api";

export default async function Home() {
  const categories = await api.categories();

  return (
    <main>
      <Container>
        {/* Hero */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                Encontrá proveedores recomendados para consorcios
              </h1>
              <p className="mt-2 max-w-2xl text-slate-600">
                Buscá por rubro y zona. Mirá ranking, reseñas moderadas y proveedores destacados.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/buscar"
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                >
                  Buscar proveedores
                </Link>
                <Link
                  href="/ranking/mantenimiento-plomeria"
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                >
                  Ver ranking
                </Link>
              </div>
            </div>

            <div className="grid w-full max-w-sm grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs text-slate-500">Proveedores</div>
                <div className="mt-1 text-2xl font-semibold">★</div>
                <div className="text-xs text-slate-500">con reputación</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs text-slate-500">Reseñas</div>
                <div className="mt-1 text-2xl font-semibold">✓</div>
                <div className="text-xs text-slate-500">moderadas</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs text-slate-500">Destacados</div>
                <div className="mt-1 text-2xl font-semibold">⭐</div>
                <div className="text-xs text-slate-500">más visibilidad</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs text-slate-500">Zonas</div>
                <div className="mt-1 text-2xl font-semibold">📍</div>
                <div className="text-xs text-slate-500">por ciudad</div>
              </div>
            </div>
          </div>
        </section>

        {/* Rubros */}
        <section className="mt-10">
          <div className="flex items-end justify-between">
            <h2 className="text-lg font-semibold">Rubros</h2>
            <Link className="text-sm text-slate-600 underline hover:text-slate-900" href="/buscar">
              Ir a buscar →
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/rubros/${c.slug}`}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md"
              >
                <div className="text-sm font-semibold">{c.name}</div>
                <div className="mt-1 text-xs text-slate-500">{c.slug}</div>
                <div className="mt-4 text-xs text-slate-500">Ver proveedores →</div>
              </Link>
            ))}
          </div>
        </section>
      </Container>
    </main>
  );
}
