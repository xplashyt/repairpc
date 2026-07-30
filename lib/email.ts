import { Resend } from "resend";
import { formatCOP, findGuia } from "./products";
import { buildDownloadUrl, readGuideFile } from "./guides";

/**
 * Los dos correos que salen cuando un pago queda APPROVED:
 *
 *   1. sendGuideEmail        → al comprador, con el PDF adjunto.
 *   2. sendSaleNotification  → a ti, para que sepas que vendiste.
 *
 * Ninguno atrapa sus errores: si el envío falla dejamos explotar la
 * excepción para que el webhook responda 500 y Wompi reintente el evento.
 * Un correo perdido aquí es un cliente que pagó y no recibió nada.
 */

function resendClient(): { resend: Resend; from: string } {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ORDER_FROM_EMAIL || "Guías PC <onboarding@resend.dev>";

  if (!apiKey) throw new Error("Falta RESEND_API_KEY");

  return { resend: new Resend(apiKey), from };
}

const marco = (contenido: string) => `
  <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:560px;color:#0F172A">
    ${contenido}
  </div>
`;

/* ------------------------------------------------------------------ */
/* 1. Correo de entrega al comprador                                   */
/* ------------------------------------------------------------------ */

export interface GuideEmailData {
  productId: string;
  customerEmail: string;
  reference: string;
}

export async function sendGuideEmail(data: GuideEmailData): Promise<void> {
  const { resend, from } = resendClient();

  const guia = findGuia(data.productId);
  if (!guia) {
    throw new Error(`No existe la guía "${data.productId}" en lib/products.ts`);
  }

  // Si el PDF no está en guides/, esto lanza con un mensaje explícito
  // antes de mandar un correo sin adjunto.
  const archivo = readGuideFile(data.productId);
  const enlace = buildDownloadUrl(data.productId);

  const html = marco(`
    <h2 style="margin:0 0 6px;font-size:22px">Aquí está tu guía</h2>
    <p style="margin:0 0 20px;color:#475569">
      Gracias por tu compra. Adjunto a este correo encontrarás
      <strong>${guia.nombre}</strong> en PDF.
    </p>
    <p style="margin:0 0 20px;color:#475569">
      Si tu correo bloquea los archivos adjuntos, puedes descargarla desde
      este enlace (válido por 7 días):
    </p>
    <p style="margin:0 0 24px">
      <a href="${enlace}"
         style="display:inline-block;background:#0E7490;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">
        Descargar la guía en PDF
      </a>
    </p>
    <p style="margin:0 0 8px;color:#475569;font-size:14px">
      Guarda el archivo en tu computador: el enlace caduca, el PDF no.
    </p>
    <p style="margin:24px 0 0;color:#94A3B8;font-size:12px">
      Referencia de tu compra: ${data.reference}<br />
      ¿Problemas para abrir el archivo? Responde a este correo.
    </p>
  `);

  const text = [
    `Aquí está tu guía: ${guia.nombre}`,
    "",
    "La encuentras adjunta en PDF.",
    `Enlace de descarga de respaldo (válido 7 días): ${enlace}`,
    "",
    `Referencia de tu compra: ${data.reference}`,
  ].join("\n");

  const { error } = await resend.emails.send({
    from,
    to: data.customerEmail,
    subject: `Tu guía: ${guia.nombre}`,
    html,
    text,
    attachments: [
      {
        filename: archivo.filename,
        content: archivo.buffer.toString("base64"),
      },
    ],
  });

  if (error) {
    throw new Error(`Resend rechazó el correo de entrega: ${error.message}`);
  }
}

/* ------------------------------------------------------------------ */
/* 2. Aviso de venta para el vendedor                                  */
/* ------------------------------------------------------------------ */

export interface SaleNotificationData {
  productId: string;
  amountInCents: number;
  customerEmail: string | null;
  reference: string;
  transactionId: string;
  paymentMethod: string | null;
  /** Mensaje de alerta si algo salió raro (p. ej. sin correo del cliente). */
  aviso?: string;
}

export async function sendSaleNotification(
  data: SaleNotificationData
): Promise<void> {
  const { resend, from } = resendClient();

  const to = process.env.ORDER_NOTIFY_EMAIL;
  if (!to) throw new Error("Falta ORDER_NOTIFY_EMAIL");

  const guia = findGuia(data.productId);

  const rows: [string, string][] = [
    ["Guía vendida", guia?.nombre ?? `desconocida ("${data.productId}")`],
    ["Id del producto", data.productId],
    ["Monto pagado", formatCOP(data.amountInCents / 100)],
    ["Correo del comprador", data.customerEmail || "no informado"],
    ["Medio de pago", data.paymentMethod || "no informado"],
    ["Referencia", data.reference],
    ["Transacción Wompi", data.transactionId],
  ];

  const html = marco(`
    <h2 style="margin:0 0 4px;font-size:20px">Venta confirmada</h2>
    <p style="margin:0 0 20px;color:#475569">
      La guía ya salió automáticamente al correo del comprador.
    </p>
    ${
      data.aviso
        ? `<p style="margin:0 0 20px;padding:12px;border-radius:8px;background:#FEF2F2;color:#B91C1C;font-size:14px">
             <strong>Revisar:</strong> ${data.aviso}
           </p>`
        : ""
    }
    <table style="border-collapse:collapse;width:100%;font-size:14px">
      ${rows
        .map(
          ([label, value]) => `
        <tr>
          <td style="padding:8px 12px 8px 0;color:#64748B;border-bottom:1px solid #E2E8F0;white-space:nowrap">${label}</td>
          <td style="padding:8px 0;border-bottom:1px solid #E2E8F0"><strong>${value}</strong></td>
        </tr>`
        )
        .join("")}
    </table>
  `);

  const text = rows.map(([label, value]) => `${label}: ${value}`).join("\n");

  const { error } = await resend.emails.send({
    from,
    to,
    subject: `Venta — ${guia?.nombre ?? data.productId} — ${formatCOP(
      data.amountInCents / 100
    )}`,
    html,
    text,
    ...(data.customerEmail ? { replyTo: data.customerEmail } : {}),
  });

  if (error) {
    throw new Error(`Resend rechazó el aviso de venta: ${error.message}`);
  }
}
