/**
 * Vive en su propio archivo a propósito: lo necesitan tanto el servidor
 * como el navegador, y si lo importaran desde lib/wompi-api.ts se
 * arrastraría `crypto` de Node al bundle del cliente.
 *
 * El ambiente se deduce de la llave pública, así que cambiar a llaves de
 * prueba en .env.local apunta al sandbox sin tocar código.
 */
export function wompiBaseUrl(publicKey: string): string {
  return publicKey.startsWith("pub_test_")
    ? "https://sandbox.wompi.co/v1"
    : "https://production.wompi.co/v1";
}
