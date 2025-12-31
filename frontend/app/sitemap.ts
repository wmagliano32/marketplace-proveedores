import type { MetadataRoute } from "next";

type Category = { slug: string };
type Subcategory = { slug: string; category: { slug: string } };
type Provider = { slug: string };

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { next: { revalidate: 3600 } }); // 1h
  if (!res.ok) throw new Error(`Sitemap fetch failed ${res.status} ${path}`);
  return res.json() as Promise<T>;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  try {
    const [categories, subcategories, providers] = await Promise.all([
      fetchJSON<Category[]>("/api/public/categories/"),
      fetchJSON<Subcategory[]>("/api/public/subcategories/"),
      fetchJSON<Provider[]>("/api/public/providers/"),
    ]);

    const urls: MetadataRoute.Sitemap = [
      { url: `${SITE}/`, lastModified: now },
      ...categories.map((c) => ({ url: `${SITE}/rubros/${c.slug}`, lastModified: now })),
      ...subcategories.map((s) => ({
        url: `${SITE}/rubros/${s.category.slug}/${s.slug}`,
        lastModified: now,
      })),
      ...providers.map((p) => ({ url: `${SITE}/proveedores/${p.slug}`, lastModified: now })),
      ...subcategories.map((s) => ({ url: `${SITE}/ranking/${s.slug}`, lastModified: now })),
    ];

    return urls;
  } catch {
    // fallback mínimo si la API no responde
    return [{ url: `${SITE}/`, lastModified: now }];
  }
}
