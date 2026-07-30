"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import TrustBar from "@/components/TrustBar";
import ProductCard from "@/components/ProductCard";
import CheckoutPanel from "@/components/CheckoutPanel";
import Footer from "@/components/Footer";
import { guias, type Guia } from "@/lib/products";

export default function Home() {
  const [seleccionada, setSeleccionada] = useState<Guia | null>(null);

  return (
    <>
      <Header />
      <main>
        <Hero />
        <TrustBar />

        <section id="guias" className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="font-display text-2xl font-bold md:text-3xl">
            Elige tu guía
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-niebla">
            Las dos son un PDF que te llega al correo apenas se confirma el pago.
            Pagas con tarjeta o Nequi aquí mismo, sin salir del sitio.
          </p>

          <div className="mt-10 grid items-start gap-6 md:grid-cols-2">
            {guias.map((guia) => (
              <ProductCard key={guia.id} guia={guia} onSelect={setSeleccionada} />
            ))}
          </div>

          <p className="mt-8 text-xs text-niebla/70">
            Precios en pesos colombianos (COP). El cobro lo procesa Wompi; el
            monto lo calcula nuestro servidor a partir de la guía que elegiste.
          </p>
        </section>
      </main>
      <Footer />

      {seleccionada && (
        <CheckoutPanel guia={seleccionada} onClose={() => setSeleccionada(null)} />
      )}
    </>
  );
}
