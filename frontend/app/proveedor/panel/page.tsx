"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Container from "@/components/Container";
import { apiFetch } from "@/lib/apiClient";
import { clearTokens } from "@/lib/session";

type Subcategory = {
  id: number;
  name: string;
  slug: string;
  category: { id: number; name: string; slug: string };
};

function planLabel(tier: number) {
  if (tier === 3) return "Gold";
  if (tier === 2) return "Silver";
  if (tier === 1) return "Basic";
  return "Sin plan";
}

function planPeriod(code?: string) {
  if (!code) return "";
  if (code.includes("YEARLY")) return "Anual";
  if (code.includes("MONTHLY")) return "Mensual";
  return "";
}

export default function ProviderPanelPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [profile, setProfile] = useState<any>(null);
  const [subs, setSubs] = useState<any[]>([]);
  const [subcats, setSubcats] = useState<Subcategory[]>([]);
  const [selectedSubIds, setSelectedSubIds] = useState<number[]>([]);

  const grouped = useMemo(() => {
    const map = new Map<string, { cat: Subcategory["category"]; items: Subcategory[] }>();
    for (const s of subcats) {
      const key = s.category.slug;
      if (!map.has(key)) map.set(key, { cat: s.category, items: [] });
      map.get(key)!.items.push(s);
    }
    return Array.from(map.values()).sort((a, b) => a.cat.name.localeCompare(b.cat.name));
  }, [subcats]);

  async function loadAll() {
    setErr("");
    setLoading(true);
    try {
      const [p, allSub, mySubs] = await Promise.all([
        apiFetch("/api/provider/profile/", { auth: true }),
        apiFetch<Subcategory[]>("/api/public/subcategories/", { auth: false }),
        apiFetch("/api/provider/subscriptions/", { auth: true }),
      ]);

      setProfile(p);
      setSubcats(allSub);
      setSubs(mySubs);

      const ids = Array.isArray(p?.subcategories) ? p.subcategories.map((x: any) => x.id) : [];
      setSelectedSubIds(ids);
    } catch {
      clearTokens();
      router.push("/proveedor/login?next=/proveedor/panel");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleSub(id: number) {
    setSelectedSubIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function saveProfile() {
    setErr("");
    setSaving(true);
    try {
      const body = {
        nombre_fantasia: profile.nombre_fantasia || "",
        razon_social: profile.razon_social || "",
        cuit: profile.cuit || "",
        descripcion: profile.descripcion || "",
        telefono: profile.telefono || "",
        whatsapp: profile.whatsapp || "",
        email_publico: profile.email_publico || "",
        website: profile.website || "",
        province: profile.province || "",
        city: profile.city || "",
        address: profile.address || "",
        subcategory_ids: selectedSubIds,
      };

      const updated = await apiFetch("/api/provider/profile/", { method: "PUT", body, auth: true });
      setProfile(updated);
    } catch (e: any) {
      setErr(e?.message || "Error guardando");
    } finally {
      setSaving(false);
    }
  }

  function logout() {
    clearTokens();
    router.push("/");
  }

  if (loading) {
    return (
      <main>
        <Container>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">Cargando panel…</div>
        </Container>
      </main>
    );
  }

  const tier = Number(profile?.plan_tier || 0);
  const code = String(profile?.plan_code || "");
  const plan = planLabel(tier);
  const period = planPeriod(code);

  return (
    <main>
      <Container>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Panel del proveedor</h1>
            <div className="mt-1 text-sm text-slate-600">
              Plan: <b>{plan}</b> {period ? `(${period})` : ""} · Visible: <b>{profile?.is_visible ? "Sí" : "No"}</b> · Destacado:{" "}
              <b>{profile?.is_featured ? "Sí" : "No"}</b>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white hover:opacity-90" href="/proveedor/planes">
              Cambiar plan
            </Link>
            <Link className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50" href={`/proveedores/${profile.slug}`}>
              Ver mi perfil →
            </Link>
            <button onClick={logout} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50">
              Salir
            </button>
          </div>
        </div>

        {err && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{err}</div>}

        {!profile?.is_visible && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Tu perfil todavía no está público. Elegí un plan y completá tu perfil.
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Perfil */}
          <section className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Mi perfil</h2>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                ["Nombre fantasía", "nombre_fantasia"],
                ["Razón social", "razon_social"],
                ["CUIT", "cuit"],
                ["Teléfono", "telefono"],
                ["WhatsApp", "whatsapp"],
                ["Email público", "email_publico"],
                ["Website", "website"],
                ["Provincia", "province"],
                ["Ciudad", "city"],
                ["Dirección", "address"],
              ].map(([label, key]) => (
                <div key={key}>
                  <label className="text-xs text-slate-500">{label}</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={profile?.[key] || ""}
                    onChange={(e) => setProfile((p: any) => ({ ...p, [key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>

            <div className="mt-4">
              <label className="text-xs text-slate-500">Descripción</label>
              <textarea
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                rows={4}
                value={profile?.descripcion || ""}
                onChange={(e) => setProfile((p: any) => ({ ...p, descripcion: e.target.value }))}
              />
            </div>

            <div className="mt-6">
              <div className="text-sm font-semibold">Especialidades (subrubros)</div>
              <div className="mt-2 space-y-4">
                {grouped.map((g) => (
                  <div key={g.cat.slug} className="rounded-2xl border border-slate-200 p-4">
                    <div className="text-sm font-semibold">{g.cat.name}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {g.items.map((s) => {
                        const active = selectedSubIds.includes(s.id);
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => toggleSub(s.id)}
                            className={[
                              "rounded-full border px-3 py-1 text-xs",
                              active ? "bg-slate-900 text-white border-slate-900" : "border-slate-200 bg-white hover:bg-slate-50",
                            ].join(" ")}
                          >
                            {s.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={saveProfile}
                disabled={saving}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
              <button onClick={loadAll} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50">
                Recargar
              </button>
            </div>
          </section>

          {/* Suscripción */}
          <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Suscripciones</h2>
            <p className="mt-1 text-sm text-slate-600">
              Elegí Basic/Silver/Gold mensual o anual.
            </p>

            <Link
              href="/proveedor/planes"
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Ver / Cambiar plan
            </Link>

            <div className="mt-6">
              <div className="text-sm font-semibold">Mis suscripciones</div>
              <div className="mt-2 space-y-2">
                {subs.length === 0 ? (
                  <div className="text-sm text-slate-600">Todavía no tenés suscripciones.</div>
                ) : (
                  subs.map((s: any) => (
                    <div key={s.id} className="rounded-2xl border border-slate-200 p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold">{s.plan_code}</div>
                        <div className="text-slate-600">{s.status}</div>
                      </div>
                      {s.current_period_end && (
                        <div className="mt-1 text-xs text-slate-500">
                          Vence: {new Date(s.current_period_end).toLocaleString()}
                        </div>
                      )}
                      {s.gateway_checkout_url && (
                        <a className="mt-2 inline-block text-xs underline" href={s.gateway_checkout_url} target="_blank" rel="noreferrer">
                          Ir a pagar →
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>
      </Container>
    </main>
  );
}
