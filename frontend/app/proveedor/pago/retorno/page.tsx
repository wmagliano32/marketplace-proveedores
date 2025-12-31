"use client";

import Link from "next/link";
import Container from "@/components/Container";

export default function PagoRetornoPage() {
  return (
    <main>
      <Container>
        <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Pago recibido</h1>
          <p className="mt-2 text-slate-600">
            Estamos procesando la suscripción. Si ya se acreditó, en unos instantes vas a figurar en el directorio.
          </p>

          <div className="mt-5 flex gap-2">
            <Link className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white hover:opacity-90" href="/proveedor/panel">
              Ir a mi panel
            </Link>
            <Link className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50" href="/buscar">
              Ver directorio
            </Link>
          </div>

          <div className="mt-4 text-xs text-slate-500">
            Nota: en desarrollo local, el webhook necesita que tu backend esté expuesto (ngrok).
          </div>
        </div>
      </Container>
    </main>
  );
}
