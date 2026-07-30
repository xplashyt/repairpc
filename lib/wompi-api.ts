import { buildIntegritySignature } from "./wompi";
import { wompiBaseUrl } from "./wompi-env";

export { wompiBaseUrl };

/**
 * Cliente de la API de Wompi.
 *
 * Este proyecto NO usa el widget ni el Web Checkout: el formulario vive en
 * nuestra propia página y hablamos con la API directamente. El reparto de
 * responsabilidades importa:
 *
 *   - Los datos de la tarjeta se tokenizan desde el NAVEGADOR contra Wompi
 *     usando la llave pública (ver lib/wompi-client.ts). El número de
 *     tarjeta nunca pasa por nuestro servidor, que es lo que nos mantiene
 *     fuera del alcance más pesado de PCI DSS.
 *   - La transacción se crea desde el SERVIDOR con la llave privada, que
 *     nunca sale de aquí.
 */

function serverConfig() {
  const publicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY;
  const privateKey = process.env.WOMPI_PRIVATE_KEY;
  const integritySecret = process.env.WOMPI_INTEGRITY_SECRET;

  if (!publicKey) throw new Error("Falta NEXT_PUBLIC_WOMPI_PUBLIC_KEY");
  if (!privateKey) throw new Error("Falta WOMPI_PRIVATE_KEY");
  if (!integritySecret) throw new Error("Falta WOMPI_INTEGRITY_SECRET");

  return { publicKey, privateKey, integritySecret, base: wompiBaseUrl(publicKey) };
}

export interface AcceptanceTokens {
  acceptanceToken: string;
  acceptanceUrl: string;
  personalDataToken: string;
  personalDataUrl: string;
}

/**
 * Wompi exige que el usuario acepte dos contratos (reglamento y
 * tratamiento de datos) antes de cobrar. Los tokens vienen firmados y
 * caducan a la hora, así que se piden justo antes de pagar, no se cachean.
 */
export async function getAcceptanceTokens(): Promise<AcceptanceTokens> {
  const { publicKey, base } = serverConfig();

  const res = await fetch(`${base}/merchants/${publicKey}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Wompi /merchants respondió ${res.status}`);
  }

  const { data } = await res.json();

  return {
    acceptanceToken: data.presigned_acceptance.acceptance_token,
    acceptanceUrl: data.presigned_acceptance.permalink,
    personalDataToken: data.presigned_personal_data_auth.acceptance_token,
    personalDataUrl: data.presigned_personal_data_auth.permalink,
  };
}

export type PaymentMethodInput =
  | { type: "CARD"; token: string; installments: number }
  | { type: "NEQUI"; phone_number: string };

export interface CreateTransactionInput {
  reference: string;
  amountInCents: number;
  customerEmail: string;
  paymentMethod: PaymentMethodInput;
  acceptanceToken: string;
  personalDataToken: string;
  customerFullName: string;
  customerIp?: string;
}

export interface WompiTransaction {
  id: string;
  status: "PENDING" | "APPROVED" | "DECLINED" | "VOIDED" | "ERROR" | string;
  status_message?: string | null;
  reference: string;
  amount_in_cents: number;
  customer_email?: string | null;
  payment_method_type?: string;
  payment_method?: { extra?: Record<string, unknown> };
}

export async function createTransaction(
  input: CreateTransactionInput
): Promise<WompiTransaction> {
  const { privateKey, integritySecret, base } = serverConfig();

  const signature = buildIntegritySignature(
    input.reference,
    input.amountInCents,
    "COP",
    integritySecret
  );

  const res = await fetch(`${base}/transactions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${privateKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      acceptance_token: input.acceptanceToken,
      accept_personal_auth: input.personalDataToken,
      amount_in_cents: input.amountInCents,
      currency: "COP",
      customer_email: input.customerEmail,
      reference: input.reference,
      signature,
      payment_method: input.paymentMethod,
      customer_data: { full_name: input.customerFullName },
      ...(input.customerIp ? { ip: input.customerIp } : {}),
    }),
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    // El detalle crudo lleva nombres de campos internos de Wompi, útiles
    // para depurar pero no para mostrárselos al cliente.
    console.error("Wompi rechazó la transacción:", JSON.stringify(body));

    const detalle = collectMessages(body?.error?.messages);
    throw new Error(
      detalle.join(" ") || body?.error?.reason || `Wompi respondió ${res.status}`
    );
  }

  return body.data as WompiTransaction;
}

/**
 * Los errores de validación de Wompi vienen anidados y con profundidad
 * variable, p. ej.:
 *   { payment_method: { messages: { token: ["Formato inválido"] } } }
 * Recogemos solo los textos de las hojas; los nombres de los campos no le
 * dicen nada a quien está comprando.
 */
function collectMessages(node: unknown, out: string[] = []): string[] {
  if (typeof node === "string") out.push(node);
  else if (Array.isArray(node)) node.forEach((n) => collectMessages(n, out));
  else if (node && typeof node === "object")
    Object.values(node).forEach((n) => collectMessages(n, out));
  return out;
}

/**
 * Consulta de estado. Se usa con la llave pública porque el navegador
 * consulta a través de nuestra ruta /api/wompi/status mientras espera a
 * que el pago se resuelva (la tarjeta tarda segundos; el push de Nequi,
 * lo que el usuario se demore en aceptarlo en su celular).
 */
export async function getTransaction(id: string): Promise<WompiTransaction> {
  const { publicKey, base } = serverConfig();

  const res = await fetch(`${base}/transactions/${id}`, {
    headers: { Authorization: `Bearer ${publicKey}` },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Wompi /transactions/${id} respondió ${res.status}`);
  }

  const { data } = await res.json();
  return data as WompiTransaction;
}
