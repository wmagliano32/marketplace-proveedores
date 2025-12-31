import Link from "next/link";
import Container from "@/components/Container";
import AdSlot from "@/components/AdSlot";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <Container className="py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">W</span>
            <div className="leading-tight">
              <div className="font-semibold">Proveedores</div>
              <div className="text-xs text-slate-500">Directorio + Ranking</div>
            </div>
          </Link>

          <nav className="flex items-center gap-3">
            <Link className="rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50" href="/buscar">
              Buscar
            </Link>
            <Link className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white hover:opacity-90" href="/proveedor/registrar">
              Publicar Servicio
            </Link>
            <Link className="rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50" href="/anunciar">
            Anunciá
          </Link>

          </nav>
        </div>

        {/* Banner Header */}
        <div className="mt-3 hidden md:block">
          <AdSlot placement="HEADER" variant="banner" />
        </div>
      </Container>
    </header>
  );
}
