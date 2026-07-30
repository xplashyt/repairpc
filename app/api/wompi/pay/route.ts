import { NextRequest, NextResponse } from "next/server";
import { parseReference } from "@/lib/orders";
import {
  createTransaction,
  getAcceptanceTokens,
  type PaymentMethodInput,
} from "@/lib/wompi-api";

export const runtime = "nodejs";

const CUOTAS_VALIDAS = [1, 2, 3, 6, 12, 18, 24, 36];

/**
 * Inicia el cobro. Recibe del navegador solo lo que no puede falsificarse
 * en nuestra contra: el token de la tarjeta (o el celular de Nequi), la
 * referencia y el correo de entrega. El monto lo pone el servidor.
 *
 * Responder 200 aquí NO significa que el pago se completó: casi siempre
 * la transacción nace en PENDING. El estado real se consulta con
 * /api/wompi/status, y la entrega de la guía se dispara desde el webhook.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body?.reference || !body?.email) {
    return NextResponse.json(
      { error: "Faltan datos del pedido" },
      { status: 400 }
    );
  }

  // Wompi exige aceptación explícita de sus dos contratos. Nosotros
  // adjuntamos los tokens más abajo, así que el servidor tiene que
  // confirmar que el usuario de verdad marcó la casilla: aceptar en su
  // nombre sin que lo haya hecho vaciaría de sentido el requisito.
  if (body.acceptedTerms !== true) {
    return NextResponse.json(
      { error: "Debes aceptar los términos de Wompi para pagar" },
      { status: 400 }
    );
  }

  const email = String(body.email).trim();
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json(
      { error: "El correo no parece válido y es a donde enviamos la guía" },
      { status: 400 }
    );
  }

  // Igual que en la firma: el precio jamás se toma del navegador, se
  // deriva de la guía que viaja dentro de la referencia.
  const order = parseReference(String(body.reference));

  if (!order?.guia) {
    return NextResponse.json(
      { error: "Referencia inválida o guía desconocida" },
      { status: 400 }
    );
  }

  let paymentMethod: PaymentMethodInput;

  if (body.method === "CARD") {
    if (!body.cardToken) {
      return NextResponse.json({ error: "Falta el token de la tarjeta" }, { status: 400 });
    }
    const installments = Number(body.installments) || 1;
    if (!CUOTAS_VALIDAS.includes(installments)) {
      return NextResponse.json({ error: "Número de cuotas no válido" }, { status: 400 });
    }
    paymentMethod = { type: "CARD", token: String(body.cardToken), installments };
  } else if (body.method === "NEQUI") {
    const phone = String(body.phoneNumber || "").replace(/\D/g, "");
    if (!/^3\d{9}$/.test(phone)) {
      return NextResponse.json(
        { error: "El número de Nequi debe ser un celular colombiano de 10 dígitos" },
        { status: 400 }
      );
    }
    paymentMethod = { type: "NEQUI", phone_number: phone };
  } else {
    return NextResponse.json({ error: "Medio de pago no soportado" }, { status: 400 });
  }

  try {
    // Los tokens de aceptación caducan, así que se piden en el momento en
    // vez de dejar que el navegador nos mande unos viejos.
    const tokens = await getAcceptanceTokens();

    const tx = await createTransaction({
      reference: String(body.reference),
      amountInCents: order.guia.priceCOP * 100,
      // Este es el correo que Wompi nos devolverá en el webhook y al que
      // se enviará la guía. Por eso se valida arriba.
      customerEmail: email,
      paymentMethod,
      acceptanceToken: tokens.acceptanceToken,
      personalDataToken: tokens.personalDataToken,
      customerFullName: `Compra guía ${order.guia.id}`,
      customerIp:
        req.headers.get("x-forwarded-for")?.split(",")[0].trim() || undefined,
    });

    return NextResponse.json({
      id: tx.id,
      status: tx.status,
      statusMessage: tx.status_message ?? null,
    });
  } catch (err) {
    console.error("Error creando transacción Wompi:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "No pudimos iniciar el pago" },
      { status: 502 }
    );
  }
}
