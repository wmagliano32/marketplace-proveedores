import Link from "next/link";
import Container from "@/components/Container";
import ProviderCard from "@/components/ProviderCard";
import ProviderFiltersBar from "@/components/ProviderFiltersBar";
import AdSlot from "@/components/AdSlot";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { next: { revalidate: 120 } });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

function pickString(v: string | string[] | undefined): string {
  if (!v) return "";
  return Array.isArray(v) ? (v[0] ?? "") : v;
}
function pickInt(v: string | string[] | undefined, fallback = 1): number {
  const s = pickString(v);
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export default async function BuscarPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = searchParams ? await searchParams : {};

  const search = pickString(sp.search);
  const category_slug = pickString(sp.category_slug);
  const subcategory_slug = pickString(sp.subcategory_slug);
  const province = pickString(sp.province);
  const city = pickString(sp.city);
  const featured = ["true", "1"].includes(pickString(sp.featured));
  const ordering = pickString(sp.ordering) || "-ranking_score";
  const page = pickInt(sp.page, 1);

  const qs = new URLSearchParams();
  if (search) qs.set("search", search);
  if (category_slug) qs.set("category_slug", category_slug);
  if (subcategory_slug) qs.set("subcategory_slug", subcategory_slug);
  if (province) qs.set("province", province);
  if (city) qs.set("city", city);
  if (featured) qs.set("featured", "true");
  if (ordering) qs.set("ordering", ordering);
  qs.set("page", String(page));

  const [categories, subcategories, pageData] = await Promise.all([
    fetchJSON<Array<{ id: number; name: string; slug: string }>>("/api/public/categories/"),
    fetchJSON<Array<{ id: number; name: string; slug: string; category: { slug: string } }>>("/api/public/subcategories/"),
    fetchJSON<any>(`/api/public/providers/?${qs.toString()}`),
  ]);

  const providers = pageData.results ?? [];
  const hasPrev = Boolean(pageData.previous);
  const hasNext = Boolean(pageData.next);

  function pageHref(nextPage: number) {
    const nextQs = new URLSearchParams(qs.toString());
    nextQs.set("page", String(nextPage));
    return `/buscar?${nextQs.toString()}`;
  }

  return (
    <main>
      <Container>
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Buscar proveedores</h1>
          <Link className="text-sm underline" href="/">
            Inicio
          </Link>
        </header>

        <div className="mt-4 grid gap-6 lg:grid-cols-3">
          {/* LEFT (contenido) */}
          <div className="lg:col-span-2">
            <ProviderFiltersBar
              basePath="/buscar"
              initial={{ search, category_slug, subcategory_slug, province, city, featured, ordering }}
              categories={categories}
              subcategories={subcategories}
            />

            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-slate-600">
                {pageData.count} resultado(s) · página {page}
              </div>

              <div className="flex gap-2">
                <Link
                  className={`rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50 ${
                    hasPrev ? "" : "pointer-events-none opacity-40"
                  }`}
                  href={pageHref(page - 1)}
                >
                  ← Anterior
                </Link>
                <Link
                  className={`rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50 ${
                    hasNext ? "" : "pointer-events-none opacity-40"
                  }`}
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

          {/* RIGHT RAIL (banner) */}
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
