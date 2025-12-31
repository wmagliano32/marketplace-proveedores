"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

type LocFacet = { value: string; count: number };
type CategoryFacet = { slug: string; name: string; count: number };
type SubcategoryFacet = {
  slug: string;
  name: string;
  count: number;
  category_slug: string;
  category_name: string;
};

type Props = {
  basePath?: string;
  fixedCategorySlug?: string;
  fixedSubcategorySlug?: string;

  initial: {
    search?: string;
    category_slug?: string;
    subcategory_slug?: string;
    province?: string;
    city?: string;
    featured?: boolean;
    ordering?: string;
  };

  categories: Category[];
  subcategories: Array<{
    id: number;
    name: string;
    slug: string;
    category: { slug: string };
  }>;
};

const ORDER_OPTIONS = [
  { value: "-ranking_score", label: "Ranking" },
  { value: "-rating_avg", label: "Mejor calificados" },
  { value: "-rating_count", label: "Más reseñas" },
  { value: "nombre_fantasia", label: "A-Z" },
] as const;

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 21l-4.3-4.3" />
      <circle cx="11" cy="11" r="7" />
    </svg>
  );
}

function IconPin() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s7-4.4 7-11a7 7 0 1 0-14 0c0 6.6 7 11 7 11z" />
      <circle cx="12" cy="11" r="2.5" />
    </svg>
  );
}

function IconCity() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 21h18" />
      <path d="M7 21V7l5-3v17" />
      <path d="M17 21V11l-5-3" />
      <path d="M9 10h.01M9 14h.01M9 18h.01" />
      <path d="M15 14h.01M15 18h.01" />
    </svg>
  );
}

function ChipRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 overflow-x-auto md:flex-wrap md:overflow-visible no-scrollbar pb-1">
      {children}
    </div>
  );
}

function Pill({
  children,
  active,
  onClick,
  title,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={[
        "shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs transition",
        "border-slate-200 bg-white hover:bg-slate-50",
        active ? "bg-slate-100" : "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function SkeletonPills({ n = 10 }: { n?: number }) {
  return (
    <ChipRow>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="h-6 w-24 shrink-0 rounded-full bg-slate-200/70 animate-pulse" />
      ))}
    </ChipRow>
  );
}

export default function ProviderFiltersBar({
  basePath = "/buscar",
  fixedCategorySlug,
  fixedSubcategorySlug,
  initial,
  categories,
  subcategories,
}: Props) {
  const router = useRouter();

  const [search, setSearch] = useState(initial.search ?? "");
  const [categorySlug, setCategorySlug] = useState(initial.category_slug ?? fixedCategorySlug ?? "");
  const [subcategorySlug, setSubcategorySlug] = useState(initial.subcategory_slug ?? fixedSubcategorySlug ?? "");
  const [province, setProvince] = useState(initial.province ?? "");
  const [city, setCity] = useState(initial.city ?? "");
  const [featured, setFeatured] = useState(Boolean(initial.featured));
  const [ordering, setOrdering] = useState(initial.ordering ?? "-ranking_score");

  const [loadingFacets, setLoadingFacets] = useState(false);

  const [featuredCount, setFeaturedCount] = useState<number>(0);
  const [categoryFacets, setCategoryFacets] = useState<CategoryFacet[]>([]);
  const [subcategoryFacets, setSubcategoryFacets] = useState<SubcategoryFacet[]>([]);
  const [provinceFacets, setProvinceFacets] = useState<LocFacet[]>([]);
  const [cityFacets, setCityFacets] = useState<LocFacet[]>([]);

  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllSubcategories, setShowAllSubcategories] = useState(false);
  const [showAllProvinces, setShowAllProvinces] = useState(false);
  const [showAllCities, setShowAllCities] = useState(false);

  const effectiveCategorySlug = fixedCategorySlug ?? categorySlug;
  const effectiveSubcategorySlug = fixedSubcategorySlug ?? subcategorySlug;

  const filteredSubcategories = useMemo(() => {
    if (!effectiveCategorySlug) return subcategories;
    return subcategories.filter((s) => s.category?.slug === effectiveCategorySlug);
  }, [subcategories, effectiveCategorySlug]);

  function buildUrl(overrides: Partial<{
    search: string;
    category_slug: string;
    subcategory_slug: string;
    province: string;
    city: string;
    featured: boolean;
    ordering: string;
  }>) {
    const qs = new URLSearchParams();

    const s = (overrides.search ?? search).trim();
    if (s) qs.set("search", s);

    if (!fixedCategorySlug) {
      const cat = (overrides.category_slug ?? categorySlug).trim();
      if (cat) qs.set("category_slug", cat);
    }
    if (!fixedSubcategorySlug) {
      const sub = (overrides.subcategory_slug ?? subcategorySlug).trim();
      if (sub) qs.set("subcategory_slug", sub);
    }

    const p = (overrides.province ?? province).trim();
    if (p) qs.set("province", p);

    const c = (overrides.city ?? city).trim();
    if (c) qs.set("city", c);

    const feat = overrides.featured ?? featured;
    if (feat) qs.set("featured", "true");

    const ord = (overrides.ordering ?? ordering).trim();
    if (ord) qs.set("ordering", ord);

    qs.set("page", "1");
    return qs.toString() ? `${basePath}?${qs.toString()}` : basePath;
  }

  function push(overrides: Parameters<typeof buildUrl>[0]) {
    router.push(buildUrl(overrides));
  }

  function clearAll() {
    setSearch("");
    if (!fixedCategorySlug) setCategorySlug("");
    if (!fixedSubcategorySlug) setSubcategorySlug("");
    setProvince("");
    setCity("");
    setFeatured(false);
    setOrdering("-ranking_score");
    router.push(basePath);
  }

  useEffect(() => {
    let alive = true;

    const t = setTimeout(async () => {
      setLoadingFacets(true);

      try {
        const locQs = new URLSearchParams();
        if (effectiveCategorySlug) locQs.set("category_slug", effectiveCategorySlug);
        if (effectiveSubcategorySlug) locQs.set("subcategory_slug", effectiveSubcategorySlug);
        if (featured) locQs.set("featured", "true");
        if (search.trim()) locQs.set("search", search.trim());
        if (province.trim()) locQs.set("province", province.trim());

        const catQs = new URLSearchParams();
        if (effectiveCategorySlug) catQs.set("category_slug", effectiveCategorySlug);
        if (effectiveSubcategorySlug) catQs.set("subcategory_slug", effectiveSubcategorySlug);
        if (featured) catQs.set("featured", "true");
        if (search.trim()) catQs.set("search", search.trim());
        if (province.trim()) catQs.set("province", province.trim());
        if (city.trim()) catQs.set("city", city.trim());

        const [locRes, catRes] = await Promise.all([
          fetch(`${API}/api/public/location-facets/?${locQs.toString()}`).then((r) => r.json()),
          fetch(`${API}/api/public/catalog-facets/?${catQs.toString()}`).then((r) => r.json()),
        ]);

        if (!alive) return;

        setProvinceFacets(locRes?.provinces ?? []);
        setCityFacets(locRes?.cities ?? []);

        setFeaturedCount(Number(catRes?.featured_count ?? 0));
        setCategoryFacets(catRes?.categories ?? []);
        setSubcategoryFacets(catRes?.subcategories ?? []);
      } catch {
        if (!alive) return;
        setProvinceFacets([]);
        setCityFacets([]);
        setFeaturedCount(0);
        setCategoryFacets([]);
        setSubcategoryFacets([]);
      } finally {
        if (alive) setLoadingFacets(false);
      }
    }, 250);

    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [effectiveCategorySlug, effectiveSubcategorySlug, featured, search, province, city]);

  const categoryName =
    fixedCategorySlug ? categories.find((c) => c.slug === fixedCategorySlug)?.name ?? fixedCategorySlug : "";

  const visibleCategories = showAllCategories ? categoryFacets : categoryFacets.slice(0, 12);
  const visibleSubcategories = showAllSubcategories ? subcategoryFacets : subcategoryFacets.slice(0, 12);
  const visibleProvinces = showAllProvinces ? provinceFacets : provinceFacets.slice(0, 10);
  const visibleCities = showAllCities ? cityFacets : cityFacets.slice(0, 10);

  const active = [
    search.trim()
      ? { k: "search", label: `Buscar: ${search.trim()}`, clear: () => { setSearch(""); push({ search: "" }); } }
      : null,
    !fixedCategorySlug && categorySlug
      ? { k: "cat", label: `Rubro: ${categorySlug}`, clear: () => { setCategorySlug(""); setSubcategorySlug(""); push({ category_slug: "", subcategory_slug: "" }); } }
      : null,
    !fixedSubcategorySlug && subcategorySlug
      ? { k: "sub", label: `Subrubro: ${subcategorySlug}`, clear: () => { setSubcategorySlug(""); push({ subcategory_slug: "" }); } }
      : null,
    province.trim()
      ? { k: "prov", label: `Prov: ${province.trim()}`, clear: () => { setProvince(""); setCity(""); push({ province: "", city: "" }); } }
      : null,
    city.trim()
      ? { k: "city", label: `Ciudad: ${city.trim()}`, clear: () => { setCity(""); push({ city: "" }); } }
      : null,
    featured
      ? { k: "feat", label: `Destacados`, clear: () => { setFeatured(false); push({ featured: false }); } }
      : null,
  ].filter(Boolean) as Array<{ k: string; label: string; clear: () => void }>;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
      {/* chips activos */}
      {active.length > 0 && (
        <ChipRow>
          {active.map((c) => (
            <Pill key={c.k} onClick={c.clear} title="Quitar filtro">
              {c.label} <span className="text-slate-500">✕</span>
            </Pill>
          ))}
          <Pill onClick={clearAll} title="Limpiar todo">
            Limpiar todo
          </Pill>
        </ChipRow>
      )}

      {/* orden */}
      <div>
        <div className="mb-2 text-xs text-slate-500">Orden</div>
        <ChipRow>
          {ORDER_OPTIONS.map((o) => (
            <Pill
              key={o.value}
              active={ordering === o.value}
              onClick={() => { setOrdering(o.value); push({ ordering: o.value }); }}
            >
              {o.label}
            </Pill>
          ))}
        </ChipRow>
      </div>

      {/* destacado */}
      <ChipRow>
        <Pill
          active={featured}
          onClick={() => {
            const next = !featured;
            setFeatured(next);
            push({ featured: next });
          }}
          title="Filtrar solo destacados"
        >
          ⭐ Destacados <span className="text-slate-500">({featuredCount})</span>
        </Pill>
        {loadingFacets && <span className="text-xs text-slate-500 self-center">Actualizando…</span>}
      </ChipRow>

      {/* rubros/subrubros */}
      {!fixedCategorySlug && (
        <div>
          <div className="mb-2 text-xs text-slate-500">Rubros</div>
          {loadingFacets ? (
            <SkeletonPills n={10} />
          ) : (
            <ChipRow>
              {visibleCategories.map((f) => (
                <Pill
                  key={f.slug}
                  active={categorySlug === f.slug}
                  onClick={() => {
                    setCategorySlug(f.slug);
                    setSubcategorySlug("");
                    push({ category_slug: f.slug, subcategory_slug: "" });
                  }}
                >
                  {f.name} <span className="text-slate-500">({f.count})</span>
                </Pill>
              ))}
              {categoryFacets.length > 12 && (
                <Pill onClick={() => setShowAllCategories((v) => !v)}>
                  {showAllCategories ? "Ver menos" : "Ver más"}
                </Pill>
              )}
            </ChipRow>
          )}
        </div>
      )}

      {!fixedSubcategorySlug && (
        <div>
          <div className="mb-2 text-xs text-slate-500">Subrubros</div>
          {loadingFacets ? (
            <SkeletonPills n={10} />
          ) : (
            <ChipRow>
              {visibleSubcategories.map((f) => (
                <Pill
                  key={f.slug}
                  active={subcategorySlug === f.slug}
                  onClick={() => {
                    if (!fixedCategorySlug) setCategorySlug(f.category_slug);
                    setSubcategorySlug(f.slug);
                    push({ category_slug: f.category_slug, subcategory_slug: f.slug });
                  }}
                >
                  {f.name} <span className="text-slate-500">({f.count})</span>
                </Pill>
              ))}
              {subcategoryFacets.length > 12 && (
                <Pill onClick={() => setShowAllSubcategories((v) => !v)}>
                  {showAllSubcategories ? "Ver menos" : "Ver más"}
                </Pill>
              )}
            </ChipRow>
          )}
        </div>
      )}

      {/* inputs con iconos */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
        <div className="md:col-span-2">
          <div className="text-xs text-slate-500">Buscar</div>
          <div className="relative mt-1">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              <IconSearch />
            </div>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-10 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              placeholder="Plomero, electricista, pintura..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") push({}); }}
            />
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-500">Rubro</div>
          {fixedCategorySlug ? (
            <input className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" value={categoryName} readOnly />
          ) : (
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              value={categorySlug}
              onChange={(e) => { setCategorySlug(e.target.value); setSubcategorySlug(""); }}
            >
              <option value="">Todos</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <div className="text-xs text-slate-500">Subrubro</div>
          {fixedSubcategorySlug ? (
            <input className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" value={fixedSubcategorySlug} readOnly />
          ) : (
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              value={subcategorySlug}
              onChange={(e) => setSubcategorySlug(e.target.value)}
            >
              <option value="">Todos</option>
              {filteredSubcategories.map((s) => (
                <option key={s.slug} value={s.slug}>{s.name}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <div className="text-xs text-slate-500">Provincia</div>
          <div className="relative mt-1">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              <IconPin />
            </div>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-10 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              placeholder="Buenos Aires"
              value={province}
              onChange={(e) => { setProvince(e.target.value); setCity(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") push({}); }}
            />
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-500">Ciudad</div>
          <div className="relative mt-1">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              <IconCity />
            </div>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-10 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              placeholder="CABA"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") push({}); }}
            />
          </div>
        </div>
      </div>

      {/* provincias/ciudades */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <div className="mb-2 text-xs text-slate-500">Provincias (top)</div>
          {loadingFacets ? (
            <SkeletonPills n={8} />
          ) : (
            <ChipRow>
              {visibleProvinces.map((f) => (
                <Pill
                  key={f.value}
                  active={province.trim().toLowerCase() === f.value.toLowerCase()}
                  onClick={() => { setProvince(f.value); setCity(""); push({ province: f.value, city: "" }); }}
                >
                  {f.value} <span className="text-slate-500">({f.count})</span>
                </Pill>
              ))}
              {provinceFacets.length > 10 && (
                <Pill onClick={() => setShowAllProvinces((v) => !v)}>
                  {showAllProvinces ? "Ver menos" : "Ver más"}
                </Pill>
              )}
            </ChipRow>
          )}
        </div>

        <div>
          <div className="mb-2 text-xs text-slate-500">Ciudades (top)</div>
          {loadingFacets ? (
            <SkeletonPills n={8} />
          ) : (
            <ChipRow>
              {visibleCities.map((f) => (
                <Pill
                  key={f.value}
                  active={city.trim().toLowerCase() === f.value.toLowerCase()}
                  onClick={() => { setCity(f.value); push({ city: f.value }); }}
                >
                  {f.value} <span className="text-slate-500">({f.count})</span>
                </Pill>
              ))}
              {cityFacets.length > 10 && (
                <Pill onClick={() => setShowAllCities((v) => !v)}>
                  {showAllCities ? "Ver menos" : "Ver más"}
                </Pill>
              )}
            </ChipRow>
          )}
        </div>
      </div>

      {/* acciones */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50"
          onClick={clearAll}
        >
          Limpiar
        </button>
        <button
          type="button"
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          onClick={() => push({})}
        >
          Aplicar
        </button>
      </div>
    </div>
  );
}
