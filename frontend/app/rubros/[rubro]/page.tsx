import Link from "next/link";
import Container from "@/components/Container";
import ProviderCard from "@/components/ProviderCard";
import ProviderFiltersBar from "@/components/ProviderFiltersBar";
import AdSlot from "@/components/AdSlot";
import { api } from "@/lib/api";

const API_BASE = process.env.API_INTERNAL_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

function pickString(v: string | string[] | undefined): string {
  if (!v) return "";
  return Array.isArray(v) ? (v[0] ?? "") : v;
}
function pickInt(v: string | string[] | undefined, fallback = 1): number {
  const n = Number(pickString(v));
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export default async function RubroPage({
  params,
  searchParams,
}: {
  params: Promise<{ rubro: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { rubro } = await params;
  const sp = searchParams ? await searchParams : {};

  const search = pickString(sp.search);
  const subcategory_slug = pickString(sp.subcategory_slug);
  const province = pickString(sp.province);
  const city = pickString(sp.city);
  const featured = ["true", "1"].includes(pickString(sp.featured));
  const ordering = pickString(sp.ordering) || "-ranking_score";
  const page = pickInt(sp.page, 1);

  const apiQs = new URLSearchParams();
  apiQs.set("category_slug", rubro);
  if (search) apiQs.set("search", search);
  if (subcategory_slug) apiQs.set("subcategory_slug", subcategory_slug);
  if (province) apiQs.set("province", province);
  if (city) apiQs.set("city", city);
  if (featured) apiQs.set("featured", "true");
  if (ordering) apiQs.set("ordering", ordering);
  apiQs.set("page", String(page));

  const urlQs = new URLSearchParams();
  if (search) urlQs.set("search", search);
  if (subcategory_slug) urlQs.set("subcategory_slug", subcategory_slug);
  if (province) urlQs.set("province", province);
  if (city) urlQs.set("city", city);
  if (featured) urlQs.set("featured", "true");
  if (ordering) urlQs.set("ordering", ordering);
  urlQs.set("page", String(page));

  const [categories, subcategories, pageData] = await Promise.all([
    api.categories(),
    fetchJSON<Array<{ id: number; name: string; slug: string; category: { slug: string } }>>(
      `/api/public/subcategories/?category_slug=${encodeURIComponent(rubro)}`
    ),
    api.providersPage(`?${apiQs.toString()}`),
  ]);

  const providers = pageData.results ?? [];
  const hasPrev = Boolean(pageData.previous);
  const hasNext = Boolean(pageData.next);

  function pageHref(nextPage: number) {
    const q = new URLSearchParams(urlQs.toString());
    q.set("page", String(nextPage));
    return `/rubros/${rubro}?${q.toString()}`;
  }

  return (
    <main>
      <Container>
        {/* Breadcrumbs */}
        <div className="text-sm text-slate-600">
          <Link href="/" className="underline hover:text-slate-900">Inicio</Link>
          <span className="mx-2 text-slate-400">/</span>
          <Link href="/buscar" className="underline hover:text-slate-900">Buscar</Link>
          <span className="mx-2 text-slate-400">/</span>
          <span className="text-slate-900">{rubro}</span>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Rubro: {rubro}</h1>
            <div className="mt-1 text-sm text-slate-600">
              {pageData.count} proveedor(es) · orden {ordering}
            </div>
          </div>

          <Link
            href="/buscar"
            className="inline-flex w-fit rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Buscar global →
          </Link>
        </div>

        <div className="mt-4 grid gap-6 lg:grid-cols-3">
          {/* LEFT */}
          <div className="lg:col-span-2">
            <ProviderFiltersBar
              basePath={`/rubros/${rubro}`}
              fixedCategorySlug={rubro}
              initial={{ search, subcategory_slug, province, city, featured, ordering }}
              categories={categories}
              subcategories={subcategories}
            />

            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-slate-600">Página {page}</div>
              <div className="flex gap-2">
                <Link
                  className={`rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50 ${hasPrev ? "" : "pointer-events-none opacity-40"}`}
                  href={pageHref(page - 1)}
                >
                  ← Anterior
                </Link>
                <Link
                  className={`rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50 ${hasNext ? "" : "pointer-events-none opacity-40"}`}
                  href={pageHref(page + 1)}
                >
                  Siguiente →
                </Link>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              {providers.map((p: any) => (
                <ProviderCard key={p.id} provider={p} />
              ))}
            </div>
          </div>

          {/* RIGHT RAIL */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <AdSlot placement="RIGHT_RAIL" variant="sidebar" />
            </div>
          </aside>
        </div>
      </Container>
    </main>
  );
}
