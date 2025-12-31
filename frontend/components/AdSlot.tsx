"use client";

import { useEffect, useMemo, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

type Ad = {
  id: number;
  placement: "HEADER" | "FOOTER" | "LEFT_RAIL" | "RIGHT_RAIL";
  creative_type: "IMAGE" | "COMPOSED";
  animation: "NONE" | "MARQUEE" | "PULSE" | "FLOAT";

  sponsor_name: string;
  title: string;
  subtitle: string;
  cta_text: string;

  background_color: string;
  text_color: string;
  font_family: string;
  font_size: number;

  logo_url: string;
  image_file_url: string;
  image_url: string;
  link_url: string;

  track_impression_url: string;
  track_click_url: string;
};

export default function AdSlot({
  placement,
  variant = "banner",
  hideIfEmpty = false,
}: {
  placement: "HEADER" | "FOOTER" | "LEFT_RAIL" | "RIGHT_RAIL";
  variant?: "banner" | "footer" | "sidebar" | "skyscraper";
  hideIfEmpty?: boolean;
}) {
  const [ad, setAd] = useState<Ad | null>(null);
  const [loaded, setLoaded] = useState(false);

  const box =
    variant === "skyscraper"
      ? "h-[600px] w-full"
      : variant === "sidebar"
      ? "h-[250px] w-full"
      : "h-[90px] w-full";

  useEffect(() => {
    let alive = true;

    fetch(`${API}/api/public/ads/slot/?placement=${encodeURIComponent(placement)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        setAd(d?.ad ?? null);
        setLoaded(true);

        const impUrl = d?.ad?.track_impression_url;
        if (impUrl) fetch(impUrl, { method: "POST" }).catch(() => {});
      })
      .catch(() => {
        if (!alive) return;
        setAd(null);
        setLoaded(true);
      });

    return () => {
      alive = false;
    };
  }, [placement]);

  const imgSrc = useMemo(() => {
    if (!ad) return "";
    return ad.image_file_url || ad.image_url || "";
  }, [ad]);

  if (!loaded) {
    return <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm animate-pulse ${box}`} />;
  }

  if (!ad) {
    if (hideIfEmpty) return null;
    return (
      <div className={`rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500 ${box}`}>
        Espacio publicitario ({placement})
      </div>
    );
  }

  const href = ad.track_click_url || ad.link_url || "#";

  const pulseCls = ad.animation === "PULSE" ? "adPulse" : "";
  const floatCls = ad.animation === "FLOAT" ? "adFloat" : "";
  const marqueeCls = ad.animation === "MARQUEE" ? "adMarquee" : "";

  const styleRoot: React.CSSProperties = {
    backgroundColor: ad.background_color || "#0f172a",
    color: ad.text_color || "#fff",
    fontFamily: ad.font_family || undefined,
  };

  const headlineStyle: React.CSSProperties = {
    fontSize: `${Math.max(14, Number(ad.font_size || 16))}px`,
    lineHeight: "1.1",
  };

  const subStyle: React.CSSProperties = {
    fontSize: `${Math.max(12, Number(ad.font_size || 16) - 3)}px`,
    opacity: 0.9,
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`block overflow-hidden rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition ${box}`}
      title={ad.title || ad.sponsor_name || "Anuncio"}
    >
      {/* IMAGE */}
      {ad.creative_type === "IMAGE" && imgSrc ? (
        <div className="relative h-full w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgSrc} alt={ad.title || ad.sponsor_name || "Anuncio"} className="h-full w-full object-cover" />
        </div>
      ) : (
        /* COMPOSED */
        <div className={`relative h-full w-full p-4 ${pulseCls}`} style={styleRoot}>
          <div className="flex h-full items-center gap-3">
            {ad.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={ad.logo_url}
                alt={ad.sponsor_name || "Logo"}
                className={`h-10 w-10 rounded-xl bg-white/90 object-contain p-1 ${floatCls}`}
              />
            ) : (
              <div className={`h-10 w-10 rounded-xl bg-white/15 ${floatCls}`} />
            )}

            <div className="min-w-0 flex-1">
              <div className={`font-semibold ${marqueeCls}`} style={headlineStyle}>
                {ad.title || ad.sponsor_name || "Anuncio"}
              </div>
              {ad.subtitle ? (
                <div className="mt-1" style={subStyle}>
                  {ad.subtitle}
                </div>
              ) : null}
            </div>

            {ad.cta_text ? (
              <div className="shrink-0 rounded-xl bg-white/15 px-3 py-2 text-xs font-semibold">
                {ad.cta_text} →
              </div>
            ) : null}
          </div>

          <style jsx>{`
            .adPulse {
              animation: pulseBg 3.8s ease-in-out infinite;
            }
            @keyframes pulseBg {
              0% { filter: brightness(1); }
              50% { filter: brightness(1.08); }
              100% { filter: brightness(1); }
            }

            .adFloat {
              animation: floatY 2.6s ease-in-out infinite;
            }
            @keyframes floatY {
              0% { transform: translateY(0px); }
              50% { transform: translateY(-3px); }
              100% { transform: translateY(0px); }
            }

            .adMarquee {
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
          `}</style>
        </div>
      )}
    </a>
  );
}
