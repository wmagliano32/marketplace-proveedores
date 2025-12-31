"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/apiClient";

export default function PublicReviewForm({ providerSlug }: { providerSlug: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [org, setOrg] = useState("");
  const [phone, setPhone] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  // honeypot
  const [website, setWebsite] = useState("");

  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");

  async function submit() {
    setErr("");
    setOk("");
    setSaving(true);
    try {
      const res = await apiFetch<{ ok: boolean; status: string }>(
        `/api/public/providers/${encodeURIComponent(providerSlug)}/reviews/submit/`,
        {
          method: "POST",
          body: {
            website, // honeypot (dejar vacío)
            name,
            email,
            org,
            phone,
            rating,
            comment,
          },
        }
      );

      setOk(`¡Gracias! Tu reseña quedó en estado ${res.status} (pendiente de aprobación).`);
      // opcional: limpiar comentario
      setComment("");
    } catch (e: any) {
      setErr(e?.message || "Error enviando reseña");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold">Dejar reseña (sin login)</h3>
      <p className="mt-1 text-xs text-slate-600">
        Completá tus datos. La reseña se publica luego de aprobación.
      </p>

      {ok && <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{ok}</div>}
      {err && <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{err}</div>}

      {/* honeypot (oculto) */}
      <input
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
      />

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs text-slate-500">Nombre y apellido</label>
          <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div>
          <label className="text-xs text-slate-500">Email</label>
          <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div>
          <label className="text-xs text-slate-500">Consorcio / Empresa (opcional)</label>
          <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={org} onChange={(e) => setOrg(e.target.value)} />
        </div>

        <div>
          <label className="text-xs text-slate-500">Teléfono (opcional)</label>
          <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </div>

      <div className="mt-4">
        <div className="text-xs text-slate-500 mb-2">Estrellas</div>
        <div className="flex gap-2 flex-wrap">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className={[
                "rounded-xl border px-3 py-2 text-sm",
                rating === n ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white hover:bg-slate-50",
              ].join(" ")}
            >
              {n}★
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <label className="text-xs text-slate-500">Comentario</label>
        <textarea
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Contá tu experiencia…"
        />
      </div>

      <button
        onClick={submit}
        disabled={saving || !name.trim() || !email.trim()}
        className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "Enviando…" : "Enviar reseña"}
      </button>
    </section>
  );
}
