const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

type FetchOpts = { revalidate?: number };

async function getJSON<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const revalidate = opts.revalidate ?? 300; // default 5 min
  const res = await fetch(`${API}${path}`, { next: { revalidate } });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

export type Page<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

function unwrapResults<T>(data: any): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && Array.isArray(data.results)) return data.results as T[];
  return [];
}

export type Category = { id: number; name: string; slug: string };

export type SubcategoryMini = {
  id: number;
  name: string;
  slug: string;
  category_slug: string;
  category_name: string;
};

export type ProviderListItem = {
  id: number;
  slug: string;
  nombre_fantasia: string;
  razon_social: string;
  descripcion: string;
  province: string;
  city: string;

  // ✅ NUEVO: plan
  plan_tier?: number;
  plan_code?: string;

  is_featured: boolean;
  ranking_score: number;
  rating_avg: number;
  rating_count: number;
  subcategories: SubcategoryMini[];
};

export type ProviderDetail = ProviderListItem & {
  cuit: string;
  telefono: string;
  whatsapp: string;
  email_publico: string;
  website: string;
  address: string;
};

export type ReviewPublic = { rating: number; comment: string; created_at: string; author?: string };

export const api = {
  categories: () => getJSON<Category[]>("/api/public/categories/", { revalidate: 3600 }),
  subcategories: (categorySlug: string) =>
    getJSON<any[]>(`/api/public/subcategories/?category_slug=${encodeURIComponent(categorySlug)}`, { revalidate: 3600 }),

  providersPage: (qs = "") => getJSON<Page<ProviderListItem>>(`/api/public/providers/${qs}`, { revalidate: 120 }),
  rankingPage: (qs = "") => getJSON<Page<ProviderListItem>>(`/api/public/ranking/${qs}`, { revalidate: 120 }),

  providers: async (qs = "") => unwrapResults<ProviderListItem>(await getJSON<any>(`/api/public/providers/${qs}`, { revalidate: 120 })),
  ranking: async (qs = "") => unwrapResults<ProviderListItem>(await getJSON<any>(`/api/public/ranking/${qs}`, { revalidate: 120 })),

  providerDetail: (slug: string) => getJSON<ProviderDetail>(`/api/public/providers/${encodeURIComponent(slug)}/`, { revalidate: 600 }),
  providerReviews: (slug: string) =>
    getJSON<ReviewPublic[]>(`/api/public/providers/${encodeURIComponent(slug)}/reviews/`, { revalidate: 300 }),
};
