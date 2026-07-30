import { NextRequest, NextResponse } from "next/server";
import { readGuideFile, verifyDownloadSignature } from "@/lib/guides";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Descarga de respaldo de la guía, por si el correo con el adjunto se
 * pierde o el proveedor del cliente bloquea los PDF.
 *
 * El enlace se firma con HMAC-SHA256 sobre el id de la guía y su fecha de
 * expiración (7 días). Sin base de datos, la firma es lo único que
 * distingue a un comprador de cualquiera que pruebe URLs: sin firma
 * válida y vigente, 403. Cambiar el id o la fecha en la URL invalida la
 * firma, así que no se puede "ampliar" el plazo ni saltar a la otra guía.
 *
 * GET /api/download?guia=guia-pro&exp=1753632000000&sig=<hex>
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;

  const productId = params.get("guia");
  const exp = params.get("exp");
  const sig = params.get("sig");

  if (!productId || !exp || !sig) {
    return NextResponse.json({ error: "Enlace incompleto" }, { status: 403 });
  }

  const expiresAt = Number(exp);
  if (!Number.isFinite(expiresAt)) {
    return NextResponse.json({ error: "Enlace inválido" }, { status: 403 });
  }

  // Se verifica la firma ANTES de mirar la expiración: así la respuesta
  // no distingue entre "vencido" y "falsificado" para quien no tiene una
  // firma legítima.
  if (!verifyDownloadSignature(productId, expiresAt, sig)) {
    return NextResponse.json({ error: "Enlace inválido" }, { status: 403 });
  }

  if (Date.now() > expiresAt) {
    return NextResponse.json(
      {
        error:
          "Este enlace de descarga ya venció. Escríbenos respondiendo al correo de tu compra y te lo reenviamos.",
      },
      { status: 403 }
    );
  }

  let archivo;
  try {
    archivo = readGuideFile(productId);
  } catch (err) {
    // El archivo falta en el servidor: es culpa nuestra, no del enlace.
    console.error("No pudimos leer el PDF de la guía:", err);
    return NextResponse.json(
      { error: "No pudimos entregar el archivo. Escríbenos y te lo enviamos." },
      { status: 500 }
    );
  }

  return new NextResponse(new Uint8Array(archivo.buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${archivo.filename}"`,
      "Content-Length": String(archivo.buffer.length),
      // Es contenido pagado: que no quede en cachés intermedias.
      "Cache-Control": "private, no-store",
    },
  });
}
