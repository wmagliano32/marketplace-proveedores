"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import Container from "@/components/Container";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export default function SolicitudAnuncioPage() {
  const sp = useSearchParams();
  const initialPlacement = (sp.get("placement") || "HEADER").toUpperCase();

  const [placement, setPlacement] = useState(initialPlacement);
  const [durationMonths, setDurationMonths] = useState(1);

  const [sponsorName, setSponsorName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const [creativeType, setCreativeType] = useState<"IMAGE" | "COMPOSED">("IMAGE");
  const [animation, setAnimation] = useState<"NONE" | "PULSE" | "FLOAT">("NONE");

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [ctaText, setCtaText] = useState("Conocé más");
  const [bg, setBg] = useState("#0f172a");
  const [txt, setTxt] = useState("#ffffff");
  const [fontSize, setFontSize] = useState(16);

  const [logo, setLogo] = useState<File | null>(null);
  const [image, setImage] = useState<File | null>(null);

  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");

  async function submit() {
    setErr("");
    setOk("");
    setSaving(true);

    try {
      const fd = new FormData();
      fd.append("placement", placement);
      fd.append("duration_months", String(durationMonths));

      fd.append("sponsor_name", sponsorName);
      fd.append("contact_name", contactName);
      fd.append("contact_email", contactEmail);
      fd.append("contact_phone", contactPhone);
      fd.append("link_url", linkUrl);

      fd.append("creative_type", creativeType);
      fd.append("animation", animation);

      fd.append("title", title);
      fd.append("subtitle", subtitle);
      fd.append("cta_text", ctaText);
      fd.append("background_color", bg);
      fd.append("text_color", txt);
      fd.append("font_size", String(fontSize));
      fd.append("notes", notes);

      if (logo) fd.append("logo", logo);
      if (image) fd.append("image", image);

      const res = await fetch(`${API}/api/public/ads/request/`, {
        method: "POST",
        body: fd,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || `HTTP ${res.status}`);

      setOk(`¡Listo! Recibimos tu solicitud (#${data.request_id}). Te contactamos para activar el anuncio.`);
    } catch (e: any) {
      setErr(e?.message || "Error enviando solicitud");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main>
      <Container>
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Solicitud de anuncio</h1>
          <p className="mt-2 text-sm text-slate-600">
            Completá los datos y subí tu banner/logo. Luego lo aprobamos y coordinamos el pago.
          </p>

          {ok && <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{ok}</div>}
          {err && <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{err}</div>}

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs text-slate-500">Ubicación</label>
              <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={placement} onChange={(e) => setPlacement(e.target.value)}>
                <option value="HEADER">Header</option>
                <option value="LEFT_RAIL">Lateral izquierdo</option>
                <option value="RIGHT_RAIL">Lateral derecho</option>
                <option value="FOOTER">Footer</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-500">Duración</label>
              <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={durationMonths} onChange={(e) => setDurationMonths(Number(e.target.value))}>
                <option value={1}>1 mes</option>
                <option value={3}>3 meses</option>
                <option value={6}>6 meses</option>
                <option value={12}>12 meses</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-500">Empresa / Marca</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={sponsorName} onChange={(e) => setSponsorName(e.target.value)} />
            </div>

            <div>
              <label className="text-xs text-slate-500">URL destino</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." />
            </div>

            <div>
              <label className="text-xs text-slate-500">Nombre de contacto</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={contactName} onChange={(e) => setContactName(e.target.value)} />
            </div>

            <div>
              <label className="text-xs text-slate-500">Email</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
            </div>

            <div>
              <label className="text-xs text-slate-500">Teléfono (opcional)</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 p-4">
            <div className="text-sm font-semibold">Creativo</div>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setCreativeType("IMAGE")}
                className={`rounded-xl border px-4 py-2 text-sm ${creativeType === "IMAGE" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white hover:bg-slate-50"}`}
              >
                Banner imagen
              </button>
              <button
                type="button"
                onClick={() => setCreativeType("COMPOSED")}
                className={`rounded-xl border px-4 py-2 text-sm ${creativeType === "COMPOSED" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white hover:bg-slate-50"}`}
              >
                Logo + texto
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs text-slate-500">Logo (opcional)</label>
                <input type="file" accept="image/*" className="mt-1 w-full text-sm" onChange={(e) => setLogo(e.target.files?.[0] || null)} />
              </div>

              <div>
                <label className="text-xs text-slate-500">Imagen banner (opcional si usás “Logo + texto”)</label>
                <input type="file" accept="image/*" className="mt-1 w-full text-sm" onChange={(e) => setImage(e.target.files?.[0] || null)} />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs text-slate-500">Animación</label>
                <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={animation} onChange={(e) => setAnimation(e.target.value as any)}>
                  <option value="NONE">Sin animación</option>
                  <option value="PULSE">Pulso</option>
                  <option value="FLOAT">Logo flotando</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-500">Tamaño de letra</label>
                <input type="number" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs text-slate-500">Color de fondo</label>
                <input type="color" className="mt-1 h-10 w-full rounded-xl border border-slate-200" value={bg} onChange={(e) => setBg(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-slate-500">Color de texto</label>
                <input type="color" className="mt-1 h-10 w-full rounded-xl border border-slate-200" value={txt} onChange={(e) => setTxt(e.target.value)} />
              </div>
            </div>

            <div className="mt-4">
              <label className="text-xs text-slate-500">Título</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="mt-3">
              <label className="text-xs text-slate-500">Subtítulo</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
            </div>

            <div className="mt-3">
              <label className="text-xs text-slate-500">Texto botón (CTA)</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={ctaText} onChange={(e) => setCtaText(e.target.value)} />
            </div>

            <div className="mt-3">
              <label className="text-xs text-slate-500">Notas (opcional)</label>
              <textarea className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>

          <button
            disabled={saving || !sponsorName || !contactName || !contactEmail}
            onClick={submit}
            className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Enviando…" : "Enviar solicitud"}
          </button>
        </div>
      </Container>
    </main>
  );
}
