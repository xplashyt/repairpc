import { NextResponse } from "next/server";
import { getAcceptanceTokens } from "@/lib/wompi-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Enlaces a los dos contratos que Wompi exige aceptar antes de cobrar.
 *
 * Solo se devuelven los permalinks, no los tokens: los tokens se piden de
 * nuevo en el servidor al momento de cobrar (caducan a la hora), así que
 * el navegador no tiene por qué verlos.
 */
export async function GET() {
  try {
    const { acceptanceUrl, personalDataUrl } = await getAcceptanceTokens();
    return NextResponse.json({ acceptanceUrl, personalDataUrl });
  } catch (err) {
    console.error("Error obteniendo tokens de aceptación:", err);
    return NextResponse.json(
      { error: "No pudimos cargar los términos de Wompi" },
      { status: 502 }
    );
  }
}
