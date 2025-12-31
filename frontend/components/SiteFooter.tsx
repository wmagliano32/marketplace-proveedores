import Container from "@/components/Container";
import AdSlot from "@/components/AdSlot";

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <Container className="py-6 space-y-4">
        {/* Banner Footer */}
        <div className="hidden md:block">
          <AdSlot placement="FOOTER" variant="footer" />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-600">© {new Date().getFullYear()} Directorio de Proveedores</div>
          <div className="text-xs text-slate-500">Publicidad · Rankings basados en reseñas moderadas</div>
        </div>
      </Container>
    </footer>
  );
}
