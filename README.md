# GuíasPC — venta de guías de mantenimiento de computadores con Wompi

Next.js 14 (App Router) + TypeScript + Tailwind. Vende dos guías en PDF y
las entrega **automáticamente por correo** cuando el pago se confirma.

El checkout está **integrado**: el formulario de pago es nuestro y habla
contra la API REST de Wompi. No se usa el widget ni el Web Checkout, no hay
ventanas emergentes y el cliente nunca sale del sitio.

Medios de pago disponibles: **tarjeta** y **Nequi**. PSE y Bancolombia
Transfer no se ofrecen porque exigen redirigir al portal del banco, lo que
rompería la premisa de "todo en la misma página".

Sin base de datos: la referencia de Wompi transporta qué guía se compró y el
correo del comprador lo devuelve Wompi en el webhook.

---

## 1. Instalar y correr en local

```bash
npm install
# .env.local ya viene creado con todas las claves y valores de ejemplo:
# ábrelo y reemplaza cada valor por el real.
npm run dev
```

Abre http://localhost:3000

```bash
npm run build   # verifica tipos y compila para producción
npm start       # sirve la build
```

---

## 2. Cómo sacar cada llave

### Wompi (https://comercios.wompi.co)

1. Crea tu cuenta de comercio y verifícala.
2. Ve a **Desarrolladores → Llaves**. Verás dos juegos de llaves, uno de
   **pruebas** (`pub_test_`, `prv_test_`) y uno de **producción**
   (`pub_prod_`, `prv_prod_`). Empieza con las de pruebas.

| Valor en el panel de Wompi | Variable |
|---|---|
| Llave pública | `NEXT_PUBLIC_WOMPI_PUBLIC_KEY` |
| Llave privada | `WOMPI_PRIVATE_KEY` |
| Secreto de integridad | `WOMPI_INTEGRITY_SECRET` |
| Secreto de eventos (**Desarrolladores → Eventos**) | `WOMPI_EVENTS_SECRET` |

3. En **Desarrolladores → Eventos**, registra la URL del webhook:

```
https://tu-dominio.vercel.app/api/wompi/webhook
```

> El ambiente se deduce solo de la llave pública: si empieza con
> `pub_test_` se apunta a `sandbox.wompi.co`, si no, a
> `production.wompi.co`. No hay que tocar código para cambiar.

### Resend (https://resend.com)

1. Crea la cuenta y ve a **API Keys → Create API Key** →
   `RESEND_API_KEY`.
2. Ve a **Domains** y verifica tu dominio (registros DNS que Resend indica).
   Con el dominio verificado puedes usar
   `ORDER_FROM_EMAIL=Guías PC <hola@tudominio.com>`.
3. Mientras pruebas puedes usar el remitente de prueba
   `onboarding@resend.dev`, pero **solo permite enviar al correo dueño de la
   cuenta de Resend**: cualquier otro destinatario da 403. Es decir, con el
   remitente de prueba no puedes entregarle la guía a un cliente real.
4. `ORDER_NOTIFY_EMAIL` es tu correo, donde llega el aviso de cada venta.

### Secreto de descargas

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

El resultado va en `DOWNLOAD_SIGNING_SECRET`. Si lo cambias, los enlaces de
descarga ya enviados a clientes dejan de funcionar.

---

## 3. El flujo de pago, paso a paso

1. El cliente elige una guía y llena su **correo** y los datos de pago **en
   nuestro propio formulario** (`components/CheckoutPanel.tsx`).
2. Si paga con tarjeta, el navegador tokeniza los datos **directo contra
   Wompi** con la llave pública (`lib/wompi-client.ts`). El número de
   tarjeta y el CVC nunca pasan por nuestro servidor: eso nos deja fuera del
   alcance más exigente de PCI DSS. **No muevas esa llamada al backend.**
3. El navegador manda a `/api/wompi/pay` solo el token (o el celular de
   Nequi), la referencia, el correo y el consentimiento. El servidor deriva
   el monto de la guía que va dentro de la referencia, pide los tokens de
   aceptación de Wompi (caducan, así que se piden en el momento), calcula la
   firma de integridad y crea la transacción con la llave privada. **El
   precio nunca se toma de lo que envía el navegador.**
4. Mientras la transacción está en `PENDING`, el frontend consulta
   `/api/wompi/status/[id]` cada 2,5 s (hasta 5 min). Con tarjeta suele
   resolverse en segundos; con Nequi depende de que el cliente acepte el
   push en su celular. Si cierra el panel, el polling se cancela.
5. Wompi envía un evento a `/api/wompi/webhook`. **Esa es la única fuente de
   verdad**: el estado que ve el navegador solo sirve para mostrar un
   mensaje, no para decidir si entregar la guía. El cliente puede cerrar la
   pestaña a mitad del pago y el cobro se completa igual.
6. El webhook verifica la firma del evento (401 si no cuadra), ignora todo
   lo que no sea `APPROVED`, deduplica por `transaction.id` y envía **dos
   correos** con Resend:
   - al **comprador** (`transaction.customer_email`): la guía en PDF
     adjunta más un enlace de descarga de respaldo firmado, válido 7 días;
   - a **ti** (`ORDER_NOTIFY_EMAIL`): el aviso de venta con guía, monto,
     correo del comprador, referencia e id de transacción.

Si un envío falla, la excepción sube y el webhook responde 500 para que
**Wompi reintente el evento**. El precio de eso es que un reintento puede
duplicar el correo de entrega; es un mal menor frente a que el comprador se
quede sin su guía.

### Formato de la referencia

```
guias-<idProducto>-<timestamp>
guias-guia-pro-1753632000000
```

Se parsea desde la **derecha** porque los ids de producto llevan guiones
(`guia-basica`, `guia-pro`). El timestamp solo garantiza que la referencia
sea única. El correo del comprador **no** va en la referencia: lo devuelve
Wompi en el webhook.

### Rutas de API

| Ruta | Para qué |
|---|---|
| `GET /api/wompi/acceptance` | Enlaces a los dos contratos que Wompi exige aceptar |
| `POST /api/wompi/pay` | Crea la transacción (tarjeta o Nequi) |
| `GET /api/wompi/status/[id]` | Estado del pago mientras el cliente espera |
| `POST /api/wompi/webhook` | Confirmación de Wompi — **fuente de verdad** y disparo de los correos |
| `GET /api/download` | Descarga de respaldo del PDF con enlace firmado |

`/api/download` espera `?guia=<id>&exp=<ms>&sig=<hex>`. La firma es
HMAC-SHA256 de `<id>.<exp>` con `DOWNLOAD_SIGNING_SECRET`, comparada con
`timingSafeEqual`. Sin firma válida o con el plazo vencido responde **403**.

---

## 4. Reemplazar los PDF de las guías

Los archivos viven en `guides/`, **fuera de `public/`** para que nadie pueda
descargarlos sin pagar adivinando la URL.

| Archivo | Guía |
|---|---|
| `guides/guia-basica.pdf` | Guía de mantenimiento estándar — $69.900 |
| `guides/guia-pro.pdf` | Guía completa de mantenimiento avanzado — $74.900 |

Los que vienen ahora son **marcadores de posición** (un PDF de una página
que lo dice). Sobrescríbelos conservando el mismo nombre y vuelve a
desplegar. Detalles en `guides/README.md`.

Si falta un archivo, `lib/guides.ts` lanza un error explícito con la ruta
esperada; el webhook responde 500 y Wompi reintenta, así que subir el PDF
que faltaba puede completar la entrega en el reintento.

> En Vercel los PDF viajan dentro del bundle de la función gracias a
> `outputFileTracingIncludes` en `next.config.mjs`. Si mueves la carpeta,
> actualiza esa configuración o la entrega fallará **solo en producción**.

---

## 5. Pruebas en sandbox

1. Deja `NEXT_PUBLIC_WOMPI_PUBLIC_KEY` con la llave `pub_test_...` y el
   resto de llaves de prueba.
2. Paga con las tarjetas de prueba que documenta Wompi
   (https://docs.wompi.co) — hay una que aprueba y otra que rechaza, para
   ver ambos caminos del formulario.
3. **El webhook no llega a `localhost`.** Para probar la entrega del correo
   tienes dos opciones:
   - desplegar a Vercel (aunque sea en preview) y registrar esa URL como
     webhook en el panel de Wompi; o
   - exponer tu puerto local con un túnel (`ngrok http 3000`,
     `cloudflared tunnel`) y registrar la URL del túnel.
4. Verifica que llegan los **dos** correos y que el enlace de descarga del
   correo del comprador abre el PDF. Prueba también alterar el `exp` o el
   `sig` de la URL a mano: debe responder 403.

---

## 6. Desplegar en Vercel

```bash
npx vercel
```

En **Settings → Environment Variables** puedes usar **Import .env** y subir
tu `.env.local` completo. Variables exactas a importar:

| Variable | Tipo | Nota |
|---|---|---|
| `NEXT_PUBLIC_WOMPI_PUBLIC_KEY` | pública | define sandbox vs producción |
| `WOMPI_PRIVATE_KEY` | secreta | |
| `WOMPI_INTEGRITY_SECRET` | secreta | |
| `WOMPI_EVENTS_SECRET` | secreta | |
| `RESEND_API_KEY` | secreta | |
| `ORDER_FROM_EMAIL` | — | remitente verificado en Resend |
| `ORDER_NOTIFY_EMAIL` | — | tu correo, para el aviso de venta |
| `DOWNLOAD_SIGNING_SECRET` | secreta | cadena aleatoria larga |
| `NEXT_PUBLIC_SITE_URL` | pública | tu dominio, **sin** barra al final |

Después del despliegue:

1. Registra `https://tu-dominio.vercel.app/api/wompi/webhook` en el panel de
   Wompi.
2. **Vuelve a desplegar si agregas o cambias una variable `NEXT_PUBLIC_*`.**
   Next.js las incrusta al compilar, no las lee en tiempo de ejecución:
   agregarla en Vercel sin reconstruir deja el sitio con el valor viejo (o
   sin valor).

---

## 7. Pendientes antes de vender de verdad

- **3D Secure.** Si activas 3DS para tarjetas en tu panel de Wompi, algunas
  transacciones exigirán un desafío del banco que hoy el formulario no
  maneja. Pruébalo en sandbox antes de activarlo.
- **Base de datos para los pedidos.** Hoy no se guarda nada: la
  deduplicación del webhook es un `Set` en memoria, así que si la función se
  reinicia o Vercel levanta otra instancia, un reintento tardío de Wompi
  puede reenviar el correo. Tampoco hay historial de ventas ni forma de
  reenviar una guía sin buscar la transacción en el panel de Wompi. Con
  Vercel Postgres o Supabase se resuelven las tres cosas.
- **Verificar tu dominio en Resend.** Con `onboarding@resend.dev` solo
  puedes enviarte correos a ti mismo: los clientes reales **no** recibirán
  nada. Esto es bloqueante para vender.
- **Revisión legal.** El aviso del footer (producto digital, entrega
  inmediata, retracto que no aplica a bienes digitales según el art. 47 de
  la Ley 1480 de 2011, tratamiento de datos personales) está redactado como
  punto de partida, no como asesoría jurídica. Hazlo revisar por un abogado
  y publica términos y condiciones y política de privacidad completas antes
  de operar formalmente.
- **Verificar las fórmulas de firma de Wompi** contra
  https://docs.wompi.co. Están implementadas según la documentación
  (integridad: SHA-256 de referencia + monto en centavos + moneda +
  secreto; eventos: `signature.properties` + timestamp + secreto de
  eventos vs `signature.checksum`), pero conviene confirmarlas antes de
  producción: una firma mal construida hace que Wompi rechace la
  transacción sin explicar por qué. Ver los comentarios en `lib/wompi.ts`.
- **Contracargos.** Los bienes digitales de entrega inmediata son un blanco
  común. Considera guardar la IP y el correo de cada compra como evidencia,
  y revisar manualmente los pedidos que se repitan con tarjetas distintas.
- Reemplazar los PDF de `guides/` por las guías reales.
