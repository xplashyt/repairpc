import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Guías de mantenimiento de computadores — PDF al instante",
  description:
    "Guías en PDF para darle mantenimiento a tu computador tú mismo: limpieza, pasta térmica, optimización de Windows, SSD y respaldos. Pago seguro con Wompi y entrega inmediata al correo.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-CO" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      {/* No se carga el widget ni el Web Checkout de Wompi: el formulario
          de pago es nuestro y habla con la API de Wompi directamente. Ver
          components/CheckoutPanel.tsx y lib/wompi-api.ts. */}
      <body className="bg-noche font-body text-white antialiased">{children}</body>
    </html>
  );
}
