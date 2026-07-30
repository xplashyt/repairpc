import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { findGuia } from "./products";

/**
 * Acceso a los archivos de las guías y firma de los enlaces de descarga.
 *
 * Los PDF viven en `guides/`, que está FUERA de `public/` a propósito: si
 * estuvieran en `public/` Next.js los serviría como archivos estáticos y
 * cualquiera podría descargarlos con solo adivinar la URL, sin pagar. Aquí
 * el único camino al archivo pasa por código nuestro:
 *
 *   - el webhook, que lo adjunta al correo cuando el pago fue APPROVED, y
 *   - /api/download, que exige un enlace firmado y vigente.
 *
 * Este módulo solo se puede importar desde el servidor (usa `fs`).
 */

const GUIDES_DIR = path.join(process.cwd(), "guides");

/** Los enlaces de respaldo duran 7 días desde la compra. */
const VIGENCIA_MS = 7 * 24 * 60 * 60 * 1000;

function signingSecret(): string {
  const secret = process.env.DOWNLOAD_SIGNING_SECRET;
  if (!secret) {
    throw new Error(
      "Falta DOWNLOAD_SIGNING_SECRET. Sin ese secreto no podemos firmar ni " +
        "verificar los enlaces de descarga."
    );
  }
  return secret;
}

export interface GuideFile {
  filename: string;
  buffer: Buffer;
}

/**
 * Lee el PDF de una guía. Falla con un mensaje explícito si el archivo no
 * está: es preferible un 500 legible en el log del webhook (que hace que
 * Wompi reintente) a mandarle al cliente un correo con un adjunto vacío.
 */
export function readGuideFile(productId: string): GuideFile {
  const guia = findGuia(productId);
  if (!guia) {
    throw new Error(`No existe la guía "${productId}" en lib/products.ts`);
  }

  const filePath = path.join(GUIDES_DIR, guia.archivo);

  if (!fs.existsSync(filePath)) {
    throw new Error(
      `No encontramos el archivo de la guía en ${filePath}. ` +
        `Coloca el PDF definitivo ahí con el nombre "${guia.archivo}" ` +
        `(ver guides/README.md).`
    );
  }

  return { filename: guia.archivo, buffer: fs.readFileSync(filePath) };
}

/**
 * HMAC-SHA256 sobre "<idProducto>.<expiración>". Con esto el enlace es
 * autoverificable: no hace falta base de datos para saber si es legítimo,
 * y nadie puede fabricar uno sin el secreto.
 */
function computeSignature(productId: string, expiresAt: number): string {
  return crypto
    .createHmac("sha256", signingSecret())
    .update(`${productId}.${expiresAt}`)
    .digest("hex");
}

export interface SignedDownload {
  productId: string;
  expiresAt: number;
  signature: string;
}

export function signDownload(
  productId: string,
  expiresAt: number = Date.now() + VIGENCIA_MS
): SignedDownload {
  return { productId, expiresAt, signature: computeSignature(productId, expiresAt) };
}

/**
 * Comparación en tiempo constante. Un `===` normal se detiene en el primer
 * carácter distinto, y esa diferencia de tiempo, medida muchas veces,
 * permite reconstruir la firma byte a byte.
 */
export function verifyDownloadSignature(
  productId: string,
  expiresAt: number,
  signature: string
): boolean {
  const expected = Buffer.from(computeSignature(productId, expiresAt), "utf8");
  const received = Buffer.from(signature, "utf8");

  // timingSafeEqual exige longitudes iguales; si no coinciden ya sabemos
  // que la firma es inválida y no hay nada que filtrar comparándolas.
  if (expected.length !== received.length) return false;

  return crypto.timingSafeEqual(expected, received);
}

/**
 * URL absoluta de descarga para el correo. Necesita NEXT_PUBLIC_SITE_URL
 * porque un enlace relativo no sirve dentro de un correo.
 */
export function buildDownloadUrl(productId: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  if (!base) throw new Error("Falta NEXT_PUBLIC_SITE_URL");

  const { expiresAt, signature } = signDownload(productId);

  const url = new URL("/api/download", base);
  url.searchParams.set("guia", productId);
  url.searchParams.set("exp", String(expiresAt));
  url.searchParams.set("sig", signature);

  return url.toString();
}
