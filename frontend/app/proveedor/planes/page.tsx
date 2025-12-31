"use client";

import { useEffect, useMemo, useState } from "react";
import Container from "@/components/Container";
import { apiFetch } from "@/lib/apiClient";
import { clearTokens } from "@/lib/session";
import { useRouter } from "next/navigation";

type Plan = {
  code: string;
  name: string;
  tier: number;
  interval_months: number;
  price_cents: number;
  currency: string;
};

function moneyARS(cents: number) {
  const v = (cents || 0) / 100;
  return v.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

export default function ProviderPlansPage() {
  const router = useRouter();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [mode, setMode] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [loading, setLoading] = useState(true);
  const [choosing, setChoosing] = useState<string>(""); // plan_code
  const [err, setErr] = useState("");

  // ✅ guard: si no sos PROVIDER, a login (con next)
  useEffect(() => {
    apiFetch<{ role: string }>("/api/auth/me/", { auth: true })
      .then((me) => {
        if (me.role !== "PROVIDER") {
          clearTokens();
          router.push(`/proveedor/login?next=${encodeURIComponent("/proveedor/planes")}`);
          return;
        }
        return apiFetch<Plan[]>("/api/public/plans/", { auth: false }).then(setPlans);
      })
      .catch(() => {
        clearTokens();
        router.push(`/proveedor/login?next=${encodeURIComponent("/proveedor/planes")}`);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = useMemo(() => {
    const isYear = mode === "YEARLY";
    return plans
      .filter((p) => (isYear ? p.interval_months === 12 : p.interval_months === 1))
      .sort((a, b) => a.tier - b.tier);
  }, [plans, mode]);

  async function choose(plan: Plan) {
    setErr("");
    setChoosing(plan.code);

    try {
      const res = await apiFetch<any>("/api/provider/subscriptions/start/", {
        method: "POST",
        auth: true,
        body: { plan_code: plan.code },
      });

      const url = res.checkout_url || res.gateway_checkout_url;
      if (url) {
        window.location.href = url; // ✅ redirige a MP
        return;
      }

      // Si no hay checkout_url (MP no configurado), te mando al panel
      router.push("/proveedor/panel");
    } catch (e: any) {
      const msg = e?.message || "Error";
      // ✅ solo si es auth: redirect a login
      if (String(msg).toLowerCase().includes("token") || String(msg).includes("401") || String(msg).includes("403")) {
        clearTokens();
        router.push(`/proveedor/login?next=${encodeURIComponent("/proveedor/planes")}`);
      } else {
        setErr(msg);
      }
    } finally {
      setChoosing("");
    }
  }

  return (
    <main>
      <Container>
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-semibold tracking-tight">Elegí tu plan</h1>
          <p className="mt-2 text-slate-600">
            Basic: figurar en el directorio · Silver: primera página · Gold: top 5.
          </p>

          {err && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {err}
            </div>
          )}

          <div className="mt-6 flex gap-2">
            <button
              onClick={() => setMode("MONTHLY")}
              className={`rounded-xl border px-4 py-2 text-sm ${
                mode === "MONTHLY"
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setMode("YEARLY")}
              className={`rounded-xl border px-4 py-2 text-sm ${
                mode === "YEARLY"
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              Anual (con descuento)
            </button>
          </div>

          {loading ? (
            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">Cargando planes…</div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              {rows.map((p) => {
                const tierLabel = p.tier === 1 ? "Basic" : p.tier === 2 ? "Silver" : "Gold";
                const benefits =
                  p.tier === 1
                    ? ["Figura en el directorio", "Búsqueda por rubro/zona", "Recibe reseñas"]
                    : p.tier === 2
                    ? ["Figura en primera página", "Más visibilidad", "Badge destacado"]
                    : ["Figura en top 5", "Máxima visibilidad", "Badge destacado"];

                return (
                  <div key={p.code} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="text-sm text-slate-500">{tierLabel}</div>
                    <div className="mt-1 text-2xl font-semibold">{moneyARS(p.price_cents)}</div>
                    <div className="mt-1 text-sm text-slate-600">{p.interval_months === 12 ? "por año" : "por mes"}</div>

                    <ul className="mt-4 space-y-2 text-sm text-slate-700">
                      {benefits.map((b) => (
                        <li key={b} className="flex gap-2">
                          <span className="text-emerald-600">✓</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => choose(p)}
                      disabled={Boolean(choosing)}
                      className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                    >
                      {choosing === p.code ? "Redirigiendo…" : `Elegir ${tierLabel}`}
                    </button>

                    <div className="mt-3 text-xs text-slate-500">Al elegir, se abre Mercado Pago para completar el pago.</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Container>
    </main>
  );
}
