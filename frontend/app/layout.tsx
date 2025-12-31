import "./globals.css";
import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SideSkins from "@/components/SideSkins";

export const metadata: Metadata = {
  title: "Directorio de Proveedores",
  description: "Encontrá y rankeá proveedores para consorcios por rubro, zona y reputación.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 antialiased">
        <SideSkins />
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <div className="flex-1 py-8">{children}</div>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
