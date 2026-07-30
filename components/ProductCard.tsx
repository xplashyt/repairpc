import { formatCOP, type Guia } from "@/lib/products";

export default function ProductCard({
  guia,
  onSelect,
}: {
  guia: Guia;
  onSelect: (guia: Guia) => void;
}) {
  return (
    <div
      className={`relative flex h-full flex-col rounded-2xl border p-6 transition ${
        guia.recomendada
          ? "border-cian/60 bg-panel2"
          : "border-borde bg-panel hover:border-borde/80"
      }`}
    >
      {guia.recomendada && (
        <span className="absolute -top-3 left-6 rounded-full bg-cian px-3 py-1 text-xs font-semibold text-noche">
          Recomendada
        </span>
      )}

      <h3 className="font-display text-xl font-bold leading-snug">
        {guia.nombre}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-niebla">{guia.resumen}</p>

      <p className="mt-5 font-display text-3xl font-bold text-cian">
        {formatCOP(guia.priceCOP)}
      </p>
      <p className="text-xs text-niebla">Pago único · PDF descargable</p>

      <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-niebla">
        Qué incluye
      </p>
      <ul className="mt-3 flex-1 space-y-2.5 text-sm">
        {guia.incluye.map((punto) => (
          <li key={punto} className="flex items-start gap-2.5">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="mt-1 shrink-0 text-verde"
              style={{ width: 15, height: 15 }}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 12.5 9 17.5 20 6.5" />
            </svg>
            <span className="text-niebla">{punto}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={() => onSelect(guia)}
        className={`mt-7 rounded-full py-3 font-display text-sm font-semibold transition ${
          guia.recomendada
            ? "bg-cian text-noche hover:brightness-110"
            : "border border-borde bg-transparent text-white hover:border-cian hover:text-cian"
        }`}
      >
        Comprar por {formatCOP(guia.priceCOP)}
      </button>
    </div>
  );
}
