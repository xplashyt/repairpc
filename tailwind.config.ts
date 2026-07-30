import type { Config } from "tailwindcss";

/**
 * Paleta "taller técnico": azul pizarra oscuro con acento cian/verde.
 * Los nombres están en español para que combinen con el resto del código.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        noche: "#0A1120", // fondo de la página
        panel: "#111C2F", // tarjetas y superficies
        panel2: "#17263D", // superficie destacada (tarjeta recomendada)
        borde: "#22334D", // separadores
        cian: "#22D3EE", // acento principal (CTA, enlaces)
        verde: "#34D399", // confirmaciones, "incluido"
        alerta: "#FB7185", // errores y pagos rechazados
        ambar: "#FBBF24", // avisos "sigue en proceso"
        niebla: "#93A7C4", // texto secundario
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
