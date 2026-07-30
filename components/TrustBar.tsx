const items = [
  {
    title: "Entrega inmediata al correo",
    detail:
      "Apenas Wompi confirma el pago, el PDF sale automáticamente a tu correo con un enlace de descarga de respaldo.",
  },
  {
    title: "Pago seguro con Wompi",
    detail:
      "Tarjeta o Nequi en esta misma página. Los datos de tu tarjeta viajan cifrados a Wompi y no pasan por nuestro servidor.",
  },
  {
    title: "Soporte si algo no llega",
    detail:
      "Si el correo no aparece o el archivo no abre, escríbenos con tu referencia de compra y lo resolvemos.",
  },
];

export default function TrustBar() {
  return (
    <section id="como-funciona" className="border-y border-borde/60 bg-panel/40">
      <div className="mx-auto grid max-w-5xl gap-8 px-6 py-12 sm:grid-cols-3">
        {items.map((item, i) => (
          <div key={item.title}>
            <p className="font-display text-xs font-semibold text-cian">
              0{i + 1}
            </p>
            <p className="mt-2 font-display font-semibold">{item.title}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-niebla">
              {item.detail}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
