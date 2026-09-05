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
    id: "club",
    nombre: "Únete al club",
    resumen:
      "Una opción de entrada para comenzar a cuidar tu computador con una guía práctica de bienvenida.",
    priceCOP: 4000,
    archivo: "guia-basica.pdf",
    incluye: [
      "Acceso inicial a GuíasPC",
      "Guía básica de mantenimiento como material de bienvenida",
      "Rutina práctica para comenzar a cuidar tu computador",
    ],
  },
  {
    id: "guia-limpieza",
    nombre: "Guía de limpieza física",
    resumen:
      "El paso a paso de limpieza física que evita que el polvo te dañe el equipo, sin abrir lo que no debes.",
    priceCOP: 10000,
    archivo: "guia-limpieza.pdf",
    incluye: [
      "Herramientas mínimas: qué necesitas y qué evitar",
      "Limpieza de torre y portátil sin generar electricidad estática",
      "Cómo destapar un portátil sin perder tornillos ni romper clips",
      "Qué partes no tocar si no tienes experiencia",
      "Cada cuánto repetirla según el ambiente (polvo, mascotas, humo)",
    ],
  },
  {
    id: "guia-optimizacion",
    nombre: "Guía de optimización de software",
    resumen:
      "Deja tu Windows arrancando rápido otra vez, sin formatear ni perder tus archivos.",
    priceCOP: 25000,
    archivo: "guia-optimizacion.pdf",
    incluye: [
      "Identificar qué programas retrasan el arranque",
      "Limpieza segura de archivos temporales y caché",
      "Desinstalar programas residuales que no sabías que tenías",
      "Configurar actualizaciones para que no te interrumpan a media tarea",
      "Rutina mensual de 10 minutos para mantenerlo así",
    ],
  },
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
    id: "guia-diagnostico",
    nombre: "Guía de diagnóstico de hardware",
    resumen:
      "Cómo saber cuál pieza está fallando antes de gastar en un técnico o en un repuesto que no era el problema.",
    priceCOP: 100000,
    archivo: "guia-diagnostico.pdf",
    incluye: [
      "Todo el contenido de la guía estándar",
      "Pruebas de memoria RAM sin programas de pago",
      "Diagnóstico de disco duro/SSD: salud y sectores dañados",
      "Temperaturas normales vs. temperaturas de alarma por componente",
      "Cómo aislar si el problema es la fuente de poder",
      "Checklist de diagnóstico paso a paso",
    ],
  },
  {
    id: "guia-respaldo",
    nombre: "Guía de respaldo y migración de datos",
    resumen:
      "Cómo respaldar y migrar todos tus archivos antes de cualquier cambio grande en tu equipo, sin perder nada en el camino.",
    priceCOP: 150000,
    archivo: "guia-respaldo.pdf",
    incluye: [
      "Estrategia de respaldo 3-2-1 explicada para uso doméstico",
      "Respaldo automático en la nube vs. disco externo: cuándo usar cada uno",
      "Migración de perfil de usuario a un equipo nuevo sin perder configuraciones",
      "Recuperación de archivos borrados por accidente, con herramientas gratuitas",
      "Qué respaldar antes de una reinstalación de Windows, en orden de prioridad",
    ],
  },
  {
    id: "guia-pro",
    nombre: "Guía completa de mantenimiento avanzado",
    resumen:
      "Todo lo de la guía estándar más el trabajo que normalmente le pagarías a un técnico.",
    priceCOP: 494900,
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
