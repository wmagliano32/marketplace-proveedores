export default function StarRating({ rating, count }: { rating: number; count?: number }) {
  const r = Number.isFinite(rating) ? rating : 0;
  const rounded = Math.round(r * 10) / 10;
  const full = Math.round(r); // simple: redondea a estrella entera

  const stars = Array.from({ length: 5 }, (_, i) => (i < full ? "★" : "☆")).join("");

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-amber-500">{stars}</span>
      <span className="font-medium">{rounded.toFixed(1)}</span>
      {typeof count === "number" && <span className="text-slate-500">({count})</span>}
    </div>
  );
}
