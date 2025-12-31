"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearTokens } from "@/lib/session";

export default function BackofficeNav() {
  const router = useRouter();

  function logout() {
    clearTokens();
    router.push("/backoffice/login");
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
            B
          </div>
          <div>
            <div className="font-semibold">Backoffice</div>
            <div className="text-xs text-slate-500">Moderación de reseñas</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/backoffice/reviews?status=PENDING"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50"
          >
            Reseñas
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50"
          >
            Ver sitio
          </Link>
          <button
            onClick={logout}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white hover:opacity-90"
          >
            Salir
          </button>
        </div>
      </div>
    </div>
  );
}
