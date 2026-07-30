import { findGuia, type Guia } from "./products";

/**
 * Este proyecto no tiene base de datos. El único dato propio que Wompi
 * nos devuelve sin alterar en el webhook es la referencia, así que la
 * usamos para transportar qué guía se compró:
 *
 *   guias-<idProducto>-<timestamp>
 *   guias-guia-pro-1753632000000
 *
 * El timestamp está solo para que cada referencia sea única (Wompi
 * rechaza referencias repetidas). Se parsea desde la DERECHA porque los
 * ids de producto contienen guiones ("guia-basica", "guia-pro").
 *
 * El correo del comprador NO va aquí: lo devuelve Wompi en el webhook
 * como `transaction.customer_email`. Meterlo en la referencia lo dejaría
 * visible en el panel de Wompi y lo haría manipulable desde el navegador.
 */

const PREFIX = "guias";

export function buildReference(productId: string): string {
  return `${PREFIX}-${productId}-${Date.now()}`;
}

export interface ParsedOrder {
  productId: string;
  guia: Guia | null;
}

export function parseReference(reference: string): ParsedOrder | null {
  const parts = reference.split("-");

  // guias + al menos un segmento de producto + timestamp
  if (parts.length < 3 || parts[0] !== PREFIX) return null;

  const timestamp = parts[parts.length - 1];
  const productId = parts.slice(1, -1).join("-");

  if (!/^\d+$/.test(timestamp) || !productId) return null;

  return { productId, guia: findGuia(productId) };
}
