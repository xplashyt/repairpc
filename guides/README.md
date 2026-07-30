# Carpeta `guides/` — los PDF que se venden

Aquí viven los archivos que el cliente recibe al pagar.

## Por qué NO están en `public/`

Si estos PDF estuvieran en `public/`, Next.js los serviría como archivos
estáticos y **cualquiera podría descargarlos sin pagar** con solo adivinar
la URL (`/guias/guia-pro.pdf`). Desde esta carpeta el único acceso pasa por
código nuestro:

- `app/api/wompi/webhook/route.ts` los adjunta al correo cuando Wompi
  confirma que el pago quedó `APPROVED`.
- `app/api/download/route.ts` los entrega solo con un enlace firmado con
  HMAC y vigente (7 días).

**No muevas estos archivos a `public/`.**

## Archivos que el código espera

Los nombres los define el campo `archivo` de cada guía en
`lib/products.ts`:

| Archivo | Guía | Precio |
|---|---|---|
| `guia-basica.pdf` | Guía de mantenimiento estándar | $69.900 |
| `guia-pro.pdf` | Guía completa de mantenimiento avanzado | $74.900 |

## Cómo poner los definitivos

1. Exporta tu guía a PDF.
2. Sobrescribe el archivo correspondiente de esta carpeta, **conservando
   exactamente el mismo nombre**.
3. Vuelve a desplegar (en Vercel los PDF viajan dentro del bundle de la
   función, así que un cambio de archivo requiere un nuevo despliegue).

Si prefieres otros nombres, cambia el campo `archivo` en `lib/products.ts`
para que coincida.

### Sobre el tamaño

El adjunto va dentro de un correo: Resend acepta hasta ~40 MB por mensaje,
pero muchos proveedores rechazan correos de más de 10 MB. Mantén cada PDF
por debajo de **8 MB**; si tu guía pesa más, considera comprimir las
imágenes y confiar en el enlace de descarga en lugar del adjunto.

## Si falta un archivo

`lib/guides.ts` lanza un error explícito con la ruta esperada. Eso hace que
el webhook responda 500 y **Wompi reintente el evento**, así que si subes el
PDF que faltaba la entrega puede completarse en el reintento. Revisa los
logs de la función si un cliente reporta que no recibió su guía.

## Los archivos actuales son de ejemplo

`guia-basica.pdf` y `guia-pro.pdf` son marcadores de posición generados
automáticamente: un PDF de una página que dice justamente eso. Sirven para
probar el flujo completo de compra y entrega en sandbox. **Reemplázalos
antes de vender de verdad.**
