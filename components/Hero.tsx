export default function Hero() {
  return (
    <section id="top" className="mx-auto max-w-5xl px-6 pb-16 pt-14 md:pt-20">
      <div className="grid items-center gap-12 md:grid-cols-[1.15fr_1fr]">
        <div>
          <p className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-borde bg-panel px-3.5 py-1.5 text-xs text-niebla">
            <span className="animate-latido h-2 w-2 rounded-full bg-verde" />
            PDF al correo · entrega inmediata
          </p>

          <h1 className="font-display text-4xl font-bold leading-[1.1] md:text-5xl">
            Deja de pagar{" "}
            <span className="text-cian">mantenimiento</span> cada año.
          </h1>

          <p className="mt-5 max-w-lg text-niebla">
            Guías escritas para alguien sin experiencia técnica: qué abrir, qué
            no tocar, qué producto usar y en qué orden. Con fotos, pasos
            numerados y las herramientas gratuitas que usan los técnicos.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#guias"
              className="inline-flex rounded-full bg-cian px-6 py-3 font-display font-semibold text-noche transition hover:brightness-110"
            >
              Ver las guías
            </a>
            <span className="text-sm text-niebla">
              Desde $69.900 · un solo pago
            </span>
          </div>
        </div>

        <ul className="grid gap-3 text-sm">
          {[
            ["Limpieza física", "Torre y portátil, sin romper nada"],
            ["Pasta térmica", "Cuál comprar y cómo aplicarla"],
            ["Windows liviano", "Arranque, temporales y programas basura"],
            ["Respaldos", "Para que un daño no te cueste tus archivos"],
          ].map(([titulo, detalle]) => (
            <li
              key={titulo}
              className="flex items-start gap-3 rounded-xl border border-borde bg-panel/70 px-4 py-3"
            >
              <Check />
              <span>
                <span className="font-display font-semibold">{titulo}</span>
                <span className="mt-0.5 block text-niebla">{detalle}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Check() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="mt-0.5 shrink-0 text-verde"
      style={{ width: 18, height: 18 }}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12.5 9 17.5 20 6.5" />
    </svg>
  );
}
