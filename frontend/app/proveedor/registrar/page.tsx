"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Container from "@/components/Container";
import { apiFetch } from "@/lib/apiClient";
import { setTokens, clearTokens } from "@/lib/session";

export default function ProviderRegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      await apiFetch("/api/auth/register-provider/", {
        method: "POST",
        body: { email, password },
      });

      const token = await apiFetch<{ access: string; refresh: string }>("/api/auth/token/", {
        method: "POST",
        body: { email, password },
      });

      setTokens({ access: token.access, refresh: token.refresh });

      // ✅ validar rol
      const me = await apiFetch<{ role: string }>("/api/auth/me/", { auth: true });
      if (me.role !== "PROVIDER") {
        clearTokens();
        throw new Error("Esta cuenta no es proveedor.");
      }

      router.push("/proveedor/planes");
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
          <h1 className="text-2xl font-semibold">Registrar proveedor</h1>
          <p className="mt-2 text-sm text-slate-600">
            Creá tu cuenta y completá tu perfil para aparecer en el directorio.
          </p>

          {err && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {err}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-5 space-y-3">
            <div>
              <label className="text-xs text-slate-500">Email</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="proveedor@email.com"
                required
              />
            </div>

            <div>
              <label className="text-xs text-slate-500">Contraseña</label>
              <input
                type="password"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="mínimo 8 caracteres"
                required
              />
            </div>

            <button
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Creando..." : "Crear cuenta"}
            </button>
          </form>

          <div className="mt-4 text-sm text-slate-600">
            ¿Ya tenés cuenta?{" "}
            <Link className="underline" href="/proveedor/login">
              Iniciar sesión
            </Link>
          </div>
        </div>
      </Container>
    </main>
  );
}
