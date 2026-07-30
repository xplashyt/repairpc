export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-borde/60 bg-noche/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <a href="#top" className="flex items-center gap-2.5">
          <Marca />
          <span className="font-display text-lg font-bold tracking-tight">
            Guías<span className="text-cian">PC</span>
          </span>
        </a>
        <nav className="hidden gap-8 text-sm text-niebla md:flex">
          <a href="#guias" className="transition hover:text-white">
            Guías
          </a>
          <a href="#como-funciona" className="transition hover:text-white">
            Cómo funciona
          </a>
          <a href="#soporte" className="transition hover:text-white">
            Soporte
          </a>
        </nav>
        <a
          href="#guias"
          className="rounded-full bg-cian px-4 py-2 font-display text-sm font-semibold text-noche transition hover:brightness-110"
        >
          Ver guías
        </a>
      </div>
    </header>
  );
}

/** Llave sobre una placa: taller, no videojuego. */
function Marca() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-7 w-7 text-cian"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <circle cx="10" cy="10" r="2.6" />
      <path d="M11.9 11.9 16 16" />
      <path d="M14.5 14.5 16.4 12.6" />
    </svg>
  );
}
