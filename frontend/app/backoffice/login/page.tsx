"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Container from "@/components/Container";
import { apiFetch } from "@/lib/apiClient";
import { setTokens, clearTokens } from "@/lib/session";

export default function BackofficeLoginPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/backoffice/reviews?status=PENDING";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const token = await apiFetch<{ access: string; refresh: string }>("/api/auth/token/", {
        method: "POST",
        body: { email, password },
      });

      setTokens({ access: token.access, refresh: token.refresh });

      const me = await apiFetch<{ role: string }>("/api/auth/me/", { auth: true });
      if (me.role !== "STAFF") {
        clearTokens();
        throw new Error("Se requiere usuario STAFF/superuser.");
      }

      router.push(next);
    } catch (e: any) {
      setErr(e?.message || "Error");
      clearTokens();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <Container>
        <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Backoffice</h1>
          <p className="mt-2 text-sm text-slate-600">Ingresá con tu superuser para moderar reseñas.</p>

          {err && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {err}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-5 space-y-3">
            <div>
              <label className="text-xs text-slate-500">Email</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div>
              <label className="text-xs text-slate-500">Contraseña</label>
              <input type="password" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <button disabled={loading} className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </div>
      </Container>
    </main>
  );
}
