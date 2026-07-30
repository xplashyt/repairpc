import { NextRequest, NextResponse } from "next/server";
import { getTransaction } from "@/lib/wompi-api";

export const runtime = "nodejs";

/**
 * Consulta el estado mientras el cliente espera en la página.
 *
 * Esto es solo para la interfaz. La entrega de la guía NO depende de esta
 * ruta: el usuario puede cerrar la pestaña a mitad del pago y el cobro
 * igual se completa. Quien manda es /api/wompi/webhook.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tx = await getTransaction(params.id);

    // Para PSE y Bancolombia, Wompi devuelve aquí la URL del banco. Hoy
    // no ofrecemos esos medios, pero si se agregan, el frontend la necesita.
    const asyncUrl = (tx.payment_method?.extra as { async_payment_url?: string })
      ?.async_payment_url;

    return NextResponse.json({
      id: tx.id,
      status: tx.status,
      statusMessage: tx.status_message ?? null,
      ...(asyncUrl ? { asyncPaymentUrl: asyncUrl } : {}),
    });
  } catch (err) {
    console.error("Error consultando transacción:", err);
    return NextResponse.json(
      { error: "No pudimos consultar el estado del pago" },
      { status: 502 }
    );
  }
}
