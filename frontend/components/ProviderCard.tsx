import Link from "next/link";
import StarRating from "@/components/StarRating";

function planInfo(tier: number, code?: string) {
  const period =
    (code || "").includes("YEARLY") ? "Anual" : (code || "").includes("MONTHLY") ? "Mensual" : "";

  if (tier === 3) return { label: `Gold ${period}`.trim(), cls: "border-amber-200 bg-amber-50 text-amber-800" };
  if (tier === 2) return { label: `Silver ${period}`.trim(), cls: "border-slate-200 bg-slate-50 text-slate-800" };
  if (tier === 1) return { label: `Basic ${period}`.trim(), cls: "border-slate-200 bg-white text-slate-700" };
  return null;
}

export default function ProviderCard({ provider, rank }: { provider: any; rank?: number }) {
  const name = provider.nombre_fantasia || provider.razon_social || provider.slug;
  const p = planInfo(Number(provider.plan_tier || 0), provider.plan_code);

  return (
    <Link
      href={`/proveedores/${provider.slug}`}
      className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {typeof rank === "number" && (
              <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-slate-900 px-2 text-xs font-semibold text-white">
                #{rank}
              </span>
            )}

            <div className="truncate font-semibold">{name}</div>

            {p && (
              <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${p.cls}`}>
                {p.label}
              </span>
            )}

            {provider.is_featured && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                Destacado
              </span>
            )}
          </div>

          <div className="mt-1 text-sm text-slate-600">
            {provider.city} · {provider.province}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <StarRating rating={provider.rating_avg} count={provider.rating_count} />
          <div className="mt-1 text-xs text-slate-500">
            score {Number(provider.ranking_score ?? 0).toFixed(2)}
          </div>
        </div>
      </div>

      {provider.descripcion && <p className="mt-3 text-sm text-slate-700">{provider.descripcion}</p>}

      <div className="mt-4 text-xs text-slate-500">Ver perfil →</div>
    </Link>
  );
}
