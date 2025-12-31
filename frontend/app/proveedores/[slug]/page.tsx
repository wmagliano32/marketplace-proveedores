import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/Container";
import StarRating from "@/components/StarRating";
import { api } from "@/lib/api";
import PublicReviewForm from "@/components/PublicReviewForm";

function stars(rating: number) {
  const full = Math.round(Number.isFinite(rating) ? rating : 0);
  return Array.from({ length: 5 }, (_, i) => (i < full ? "★" : "☆")).join("");
}

function waLink(raw: string) {
  const digits = (raw || "").replace(/\D/g, "");
  if (!digits) return "";
  return `https://wa.me/${digits}`;
}

function planBadge(tier: number, code?: string) {
  const period =
    (code || "").includes("YEARLY") ? "Anual" : (code || "").includes("MONTHLY") ? "Mensual" : "";

  if (tier === 3) return { label: `Gold ${period}`.trim(), cls: "border-amber-200 bg-amber-50 text-amber-800" };
  if (tier === 2) return { label: `Silver ${period}`.trim(), cls: "border-slate-200 bg-slate-50 text-slate-800" };
  if (tier === 1) return { label: `Basic ${period}`.trim(), cls: "border-slate-200 bg-white text-slate-700" };
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await api.providerDetail(slug);

  const name = p.nombre_fantasia || p.razon_social || p.slug;
  const description = (p.descripcion || `Proveedor en ${p.city} · ${p.province}`).slice(0, 160);

  return {
    title: `${name} | Proveedores`,
    description,
  };
}

export default async function ProviderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [p, reviews] = await Promise.all([api.providerDetail(slug), api.providerReviews(slug)]);

  const name = p.nombre_fantasia || p.razon_social || p.slug;
  const wa = waLink(p.whatsapp || "");
  const tel = (p.telefono || "").trim();
  const web = (p.website || "").trim();
  const mail = (p.email_publico || "").trim();

  

  const pb = planBadge(Number(p.plan_tier || 0), String(p.plan_code || ""));

  return (
    <main>
      <Container>
        {/* Breadcrumbs */}
        <div className="text-sm text-slate-600">
          <Link href="/" className="hover:text-slate-900 underline">
            Inicio
          </Link>
          <span className="mx-2 text-slate-400">/</span>
          <Link href="/buscar" className="hover:text-slate-900 underline">
            Buscar
          </Link>
          <span className="mx-2 text-slate-400">/</span>
          <span className="text-slate-900">{name}</span>
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-3">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="truncate text-2xl font-semibold tracking-tight">{name}</h1>

                    {pb && (
                      <span className={`rounded-full border px-2 py-1 text-xs font-medium ${pb.cls}`}>
                        {pb.label}
                      </span>
                    )}

                    {p.is_featured && (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">
                        ⭐ Destacado
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">📍</span>
                      {p.city} · {p.province}
                    </span>

                    <span className="text-slate-300">•</span>

                    <StarRating rating={p.rating_avg} count={p.rating_count} />
                  </div>

                  {p.descripcion && <p className="mt-4 text-slate-700 leading-relaxed">{p.descripcion}</p>}
                </div>

                <div className="shrink-0 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                  <div className="text-xs text-slate-500">Score</div>
                  <div className="mt-1 text-2xl font-semibold">{Number(p.ranking_score ?? 0).toFixed(2)}</div>
                  <div className="mt-1 text-xs text-slate-500">Ranking ponderado</div>
                </div>
              </div>

              {Array.isArray(p.subcategories) && p.subcategories.length > 0 && (
                <div className="mt-5">
                  <div className="text-xs text-slate-500 mb-2">Especialidades</div>
                  <div className="flex flex-wrap gap-2">
                    {p.subcategories.map((s: any) => (
                      <Link
                        key={s.slug}
                        href={`/rubros/${s.category_slug}/${s.slug}`}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 hover:bg-slate-200"
                      >
                        {s.category_name} · {s.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Reviews */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Reseñas</h2>
                  <div className="mt-1 text-sm text-slate-600">
                    {p.rating_count} reseña(s) · {p.rating_avg.toFixed(1)} promedio
                  </div>
                </div>

                <Link href="/buscar" className="text-sm underline text-slate-600 hover:text-slate-900">
                  Buscar otro proveedor →
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                {reviews.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-600">
                    Todavía no hay reseñas para este proveedor.
                  </div>
                ) : (
                  reviews.map((r: any, idx: number) => (
                    <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-amber-500 text-sm">{stars(r.rating)}</div>
                        <div className="text-xs text-slate-500">{new Date(r.created_at).toLocaleString()}</div>
                      </div>
                      {r.comment && <div className="mt-2 text-sm text-slate-700">{r.comment}</div>}
                      {r.author && <div className="mt-2 text-xs text-slate-500">{r.author}</div>}
                    </div>
                  ))
                )}
              </div>

              {/* Public review form (sin login) */}
              <div className="mt-6">
                <PublicReviewForm providerSlug={slug} />
              </div>
            </section>
          </div>

          {/* RIGHT */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold">Contacto</h3>
                <div className="mt-3 space-y-2">
                  {wa ? (
                    <a
                      href={wa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                    >
                      WhatsApp
                    </a>
                  ) : (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
                      WhatsApp no disponible
                    </div>
                  )}

                  {tel ? (
                    <a
                      href={`tel:${tel}`}
                      className="flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                    >
                      Llamar
                    </a>
                  ) : null}

                  {web ? (
                    <a
                      href={web}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                    >
                      Sitio web
                    </a>
                  ) : null}

                  {mail ? (
                    <a
                      href={`mailto:${mail}`}
                      className="flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                    >
                      Email
                    </a>
                  ) : null}
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                  <div className="font-medium text-slate-700">Tip</div>
                  <div className="mt-1">
                    Mirá el score y el historial de reseñas. Los planes Silver/Gold tienen mayor visibilidad.
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold">Datos</h3>
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Provincia</span>
                    <span className="font-medium">{p.province || "-"}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Ciudad</span>
                    <span className="font-medium">{p.city || "-"}</span>
                  </div>
                </div>
              </section>
            </div>
          </aside>
        </div>
      </Container>
    </main>
  );
}
