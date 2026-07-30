/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    /**
     * Las guías en PDF viven en `guides/`, FUERA de `public/`, y se leen
     * con `fs` en tiempo de ejecución. Next.js rastrea automáticamente los
     * archivos que ve importados, pero una lectura dinámica con
     * `path.join(process.cwd(), "guides")` no la detecta: en Vercel el
     * bundle de la función se subiría sin los PDFs y la entrega fallaría
     * con "no existe el archivo" solo en producción.
     *
     * Esto obliga a incluirlos en las dos rutas que los necesitan.
     */
    outputFileTracingIncludes: {
      "/api/wompi/webhook": ["./guides/**"],
      "/api/download": ["./guides/**"],
    },
  },
};

export default nextConfig;
