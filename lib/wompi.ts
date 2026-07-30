import crypto from "node:crypto";

/**
 * Firma de integridad de Wompi.
 *
 * Fórmula documentada por Wompi: SHA-256 de la concatenación de
 * referencia + monto en centavos + moneda + secreto de integridad.
 *
 * Importante: verifica esta fórmula contra la documentación vigente de
 * Wompi (https://docs.wompi.co) antes de pasar a producción. Las
 * pasarelas de pago a veces ajustan el formato exacto, y una firma mal
 * construida hace que Wompi rechace la transacción silenciosamente.
 */
export function buildIntegritySignature(
  reference: string,
  amountInCents: number,
  currency: string,
  integritySecret: string
): string {
  const chain = `${reference}${amountInCents}${currency}${integritySecret}`;
  return crypto.createHash("sha256").update(chain).digest("hex");
}

/**
 * Verificación de la firma de un evento (webhook) de Wompi.
 *
 * Wompi indica en `signature.properties` qué campos de `data` se deben
 * concatenar (en ese orden) junto con el timestamp del evento y tu
 * secreto de eventos, para luego compararlo contra `signature.checksum`.
 *
 * Igual que con la firma de integridad: confirma el detalle exacto en
 * la documentación oficial antes de confiar en esto para producción.
 */
export function verifyEventSignature(
  data: Record<string, unknown>,
  properties: string[],
  timestamp: number | string,
  checksum: string,
  eventsSecret: string
): boolean {
  const values = properties.map((path) =>
    path
      .split(".")
      .reduce<unknown>(
        (obj, key) =>
          obj && typeof obj === "object" ? (obj as Record<string, unknown>)[key] : undefined,
        data
      )
  );

  const chain = `${values.join("")}${timestamp}${eventsSecret}`;
  const expected = crypto.createHash("sha256").update(chain).digest("hex");
  return expected === checksum;
}
