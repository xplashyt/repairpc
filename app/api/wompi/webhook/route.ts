import { NextRequest, NextResponse } from "next/server";
import { verifyEventSignature } from "@/lib/wompi";
import { parseReference } from "@/lib/orders";
import { sendGuideEmail, sendSaleNotification } from "@/lib/email";

export const runtime = "nodejs";

// Wompi puede reenviar el mismo evento (reintentos, doble entrega). Esto
// evita correos duplicados dentro de una misma instancia del servidor,
// pero NO es garantía: si el proceso se reinicia o hay varias instancias,
// un reintento tardío puede volver a pasar. Con pocas ventas al día es
// suficiente; si el volumen crece, esto pide una base de datos.
const procesados = new Set<string>();

// Esta ruta es la única fuente de verdad sobre si un pago se completó.
// Lo que ve el navegador mientras hace polling es solo para mostrar un
// mensaje; nunca entregues la guía basándote únicamente en el frontend,
// porque el usuario puede cerrar la pestaña antes de que el pago se
// confirme, o alguien podría intentar falsificar esa respuesta.
export async function POST(req: NextRequest) {
  const event = await req.json().catch(() => null);

  if (!event?.signature?.checksum || !event?.signature?.properties || !event?.data) {
    return NextResponse.json({ error: "Evento inválido" }, { status: 400 });
  }

  const eventsSecret = process.env.WOMPI_EVENTS_SECRET;
  if (!eventsSecret) {
    return NextResponse.json(
      { error: "Falta configurar WOMPI_EVENTS_SECRET en el servidor" },
      { status: 500 }
    );
  }

  const isValid = verifyEventSignature(
    event.data,
    event.signature.properties,
    event.timestamp,
    event.signature.checksum,
    eventsSecret
  );

  if (!isValid) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  const transaction = (event.data as any)?.transaction;

  if (transaction?.status !== "APPROVED") {
    // Rechazado, con error o pendiente: no hay nada que entregar. El
    // cliente puede reintentar con otro medio de pago.
    console.log("Pago no aprobado:", transaction?.reference, transaction?.status);
    return NextResponse.json({ received: true });
  }

  if (procesados.has(transaction.id)) {
    return NextResponse.json({ received: true, duplicado: true });
  }

  const order = parseReference(String(transaction.reference || ""));

  if (!order?.guia) {
    // Pago cobrado pero no sabemos qué guía entregar. Se registra en el
    // log para revisarlo a mano en el panel de Wompi.
    console.error(
      "Pago aprobado con referencia ilegible:",
      transaction.reference,
      transaction.id
    );
    return NextResponse.json({ received: true, aviso: "referencia ilegible" });
  }

  // El correo del comprador lo pone Wompi, no la referencia: es el mismo
  // que se envió al crear la transacción y no se puede alterar después.
  const customerEmail: string | null = transaction.customer_email ?? null;

  const datosVenta = {
    productId: order.productId,
    amountInCents: Number(transaction.amount_in_cents) || 0,
    customerEmail,
    reference: String(transaction.reference),
    transactionId: String(transaction.id),
    paymentMethod: transaction.payment_method_type ?? null,
  };

  if (!customerEmail) {
    // Sin correo no hay a quién entregarle. Avisamos para gestionarlo a
    // mano en vez de dejar la venta en silencio.
    console.error("Pago aprobado sin customer_email:", transaction.id);
    await sendSaleNotification({
      ...datosVenta,
      aviso:
        "Wompi no devolvió el correo del comprador. La guía NO se envió: " +
        "búscalo en el panel de Wompi y mándasela a mano.",
    });
    procesados.add(transaction.id);
    return NextResponse.json({ received: true, aviso: "sin correo del comprador" });
  }

  // Primero la entrega al cliente (es lo que pagó), después el aviso.
  // Si alguno lanza, el webhook responde 500 y Wompi reintenta el evento;
  // en ese reintento el correo de entrega puede repetirse, que es un mal
  // menor frente a que el comprador se quede sin su guía.
  await sendGuideEmail({
    productId: order.productId,
    customerEmail,
    reference: String(transaction.reference),
  });

  await sendSaleNotification(datosVenta);

  // Solo se marca como procesado si ambos correos salieron bien.
  procesados.add(transaction.id);
  console.log("Guía entregada:", order.productId, transaction.reference);

  return NextResponse.json({ received: true });
}
