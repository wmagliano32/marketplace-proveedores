"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Container from "@/components/Container";
import BackofficeNav from "@/components/BackofficeNav";
import { apiFetch } from "@/lib/apiClient";
import { clearTokens } from "@/lib/session";

type Review = {
  id: number;
  provider_slug: string;
  rating: number;
  comment: string;
  status: string;
  created_at: string;
  updated_at: string;

  reviewer_email?: string;
  reviewer_email_user?: string;
  reviewer_name?: string;
  source?: string;
};

const STATUSES = ["PENDING", "PUBLISHED", "HIDDEN"] as const;

export default function BackofficeReviewsPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const status = (sp.get("status") || "PENDING").toUpperCase();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Review[]>([]);
  const [err, setErr] = useState("");

  const activeStatus = STATUSES.includes(status as any) ? (status as any) : "PENDING";

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const data = await apiFetch<Review[]>(
        `/api/backoffice/reviews/?status=${encodeURIComponent(activeStatus)}`,
        { auth: true }
      );
      setItems(data);
    } catch (e: any) {
      const msg = e?.message || "Error";
      setErr(msg);

      clearTokens();
      router.push(`/backoffice/login?next=${encodeURIComponent(`/backoffice/reviews?status=${activeStatus}`)}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    apiFetch<{ role: string }>("/api/auth/me/", { auth: true })
      .then((me) => {
        if (me.role !== "STAFF") {
          clearTokens();
          router.push(`/backoffice/login?next=${encodeURIComponent(`/backoffice/reviews?status=${activeStatus}`)}`);
          return;
        }
        load();
      })
      .catch(() => {
        clearTokens();
        router.push(`/backoffice/login?next=${encodeURIComponent(`/backoffice/reviews?status=${activeStatus}`)}`);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStatus]);

  async function setReviewStatus(id: number, newStatus: "PUBLISHED" | "HIDDEN" | "PENDING") {
    setErr("");
    try {
      await apiFetch(`/api/backoffice/reviews/${id}/`, {
        method: "PATCH",
        auth: true,
        body: { status: newStatus },
      });
      await load();
    } catch (e: any) {
      setErr(e?.message || "Error actualizando");
    }
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const s of STATUSES) c[s] = 0;
    c[activeStatus] = items.length;
    return c;
  }, [items.length, activeStatus]);

  function goStatus(s: string) {
    router.push(`/backoffice/reviews?status=${encodeURIComponent(s)}`);
  }

  return (
    <main>
      <Container>
        <BackofficeNav />

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Reseñas</h1>
            <div className="mt-1 text-sm text-slate-600">
              Estado: <b>{activeStatus}</b> {loading ? "· cargando…" : `· ${items.length} item(s)`}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => goStatus(s)}
                className={[
                  "rounded-xl border px-4 py-2 text-sm",
                  s === activeStatus
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white hover:bg-slate-50",
                ].join(" ")}
              >
                {s} {s === activeStatus ? `(${counts[s]})` : ""}
              </button>
            ))}

            <button
              onClick={load}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50"
            >
              Refrescar
            </button>
          </div>
        </div>

        {err && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {err}
          </div>
        )}

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="grid grid-cols-12 gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600">
            <div className="col-span-2">Fecha</div>
            <div className="col-span-2">Proveedor</div>
            <div className="col-span-1">★</div>
            <div className="col-span-4">Comentario</div>
            <div className="col-span-2">Autor</div>
            <div className="col-span-1 text-right">Acciones</div>
          </div>

          {loading ? (
            <div className="p-6 text-sm text-slate-600">Cargando…</div>
          ) : items.length === 0 ? (
            <div className="p-6 text-sm text-slate-600">No hay reseñas en este estado.</div>
          ) : (
            items.map((r) => {
              const author =
                r.reviewer_email_user || r.reviewer_email || r.reviewer_name || (r.source ? r.source : "—");

              return (
                <div key={r.id} className="grid grid-cols-12 gap-2 border-b border-slate-100 px-4 py-3 text-sm">
                  <div className="col-span-2 text-xs text-slate-600">
                    {new Date(r.created_at).toLocaleString()}
                  </div>

                  <div className="col-span-2">
                    <Link className="underline text-slate-800 hover:text-slate-900" href={`/proveedores/${r.provider_slug}`}>
                      {r.provider_slug}
                    </Link>
                  </div>

                  <div className="col-span-1 font-semibold">{r.rating}</div>

                  <div className="col-span-4 text-slate-700">
                    {r.comment ? r.comment.slice(0, 160) : <span className="text-slate-400">—</span>}
                    {r.comment && r.comment.length > 160 ? "…" : ""}
                  </div>

                  <div className="col-span-2 text-xs text-slate-600 break-words">{author}</div>

                  <div className="col-span-1 flex justify-end gap-2">
                    {r.status !== "PUBLISHED" && (
                      <button
                        onClick={() => setReviewStatus(r.id, "PUBLISHED")}
                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-800 hover:opacity-90"
                        title="Aprobar"
                      >
                        ✓
                      </button>
                    )}
                    {r.status !== "HIDDEN" && (
                      <button
                        onClick={() => setReviewStatus(r.id, "HIDDEN")}
                        className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-800 hover:opacity-90"
                        title="Ocultar"
                      >
                        ⛔
                      </button>
                    )}
                    {r.status !== "PENDING" && (
                      <button
                        onClick={() => setReviewStatus(r.id, "PENDING")}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                        title="Volver a pendiente"
                      >
                        ↩
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-4 text-xs text-slate-500">
          Aprobar una reseña la hace impactar en el ranking (pasa a <b>PUBLISHED</b>).
        </div>
      </Container>
    </main>
  );
}
