export interface Guia {
  id: string;
  nombre: string;
  resumen: string;
  priceCOP: number;
  /** Nombre del PDF dentro de la carpeta `guides/` (fuera de /public). */
  archivo: string;
  incluye: string[];
  recomendada?: boolean;
}

/**
 * Catálogo. Es la única fuente de precios: el servidor deriva el monto a
 * cobrar de aquí a partir del id que viaja en la referencia de Wompi, así
 * que cambiar un precio en este archivo cambia lo que realmente se cobra.
 * Nunca se toma el precio de lo que envía el navegador.
 */
export const guias: Guia[] = [
  {
    id: "guia-basica",
    nombre: "Guía de mantenimiento estándar",
    resumen:
      "El mantenimiento que todo computador necesita al menos dos veces al año, explicado paso a paso.",
    priceCOP: 69900,
    archivo: "guia-basica.pdf",
    incluye: [
      "Limpieza física de torre y portátil sin dañar componentes",
      "Cambio de pasta térmica: cuándo, cuál y cómo aplicarla",
      "Limpieza de software: archivos temporales y programas residuales",
      "Optimización del arranque de Windows",
      "Rutina de respaldos para no perder tus archivos",
      "PDF descargable, listo para imprimir",
    ],
  },
  {
    id: "guia-pro",
    nombre: "Guía completa de mantenimiento avanzado",
    resumen:
      "Todo lo de la guía estándar más el trabajo que normalmente le pagarías a un técnico.",
    priceCOP: 74900,
    archivo: "guia-pro.pdf",
    recomendada: true,
    incluye: [
      "Todo el contenido de la guía estándar",
      "Diagnóstico de hardware: identificar la pieza que está fallando",
      "Instalación y clonación a SSD, y ampliación de memoria RAM",
      "Actualización correcta de drivers, sin programas basura",
      "Reinstalación limpia de Windows desde cero",
      "Herramientas profesionales gratuitas que usan los técnicos",
      "Checklist imprimible de mantenimiento trimestral",
    ],
  },
];

export function findGuia(id: string): Guia | null {
  return guias.find((g) => g.id === id) ?? null;
}

export function formatCOP(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount);
}
