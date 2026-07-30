export default function Footer() {
  return (
    <footer id="soporte" className="border-t border-borde/60 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <p className="font-display text-lg font-bold">
          Guías<span className="text-cian">PC</span>
        </p>
        <p className="mt-2 max-w-xl text-sm text-niebla">
          ¿No te llegó el correo con la guía? Revisa tu carpeta de spam y
          escríbenos a soporte@tudominio.com con la referencia de tu compra.
        </p>

        <div className="mt-8 grid gap-6 text-xs leading-relaxed text-niebla/80 sm:grid-cols-2">
          <div>
            <p className="font-semibold text-niebla">Producto digital</p>
            <p className="mt-1">
              Lo que compras es un archivo PDF, no un servicio técnico ni una
              visita a domicilio. La entrega es inmediata y automática al correo
              que registres al pagar, apenas Wompi confirma el pago.
            </p>
          </div>
          <div>
            <p className="font-semibold text-niebla">Reembolsos</p>
            <p className="mt-1">
              Por tratarse de un bien digital de descarga inmediata, el derecho
              de retracto no aplica una vez enviado el archivo (Estatuto del
              Consumidor, Ley 1480 de 2011, art. 47). Si el archivo llega
              dañado, incompleto o no corresponde a lo comprado, te lo
              reemplazamos o te devolvemos el dinero.
            </p>
          </div>
          <div>
            <p className="font-semibold text-niebla">Datos personales</p>
            <p className="mt-1">
              Solo guardamos tu correo para enviarte la guía que compraste. Los
              datos de tu tarjeta los trata Wompi (Grupo Bancolombia) y nunca
              pasan por nuestros servidores. Puedes pedir la eliminación de tu
              correo escribiéndonos.
            </p>
          </div>
          <div>
            <p className="font-semibold text-niebla">Responsabilidad</p>
            <p className="mt-1">
              Las guías son material informativo. Abrir o intervenir un
              computador puede afectar su garantía; sigue los pasos bajo tu
              propio criterio y responsabilidad. Pagos procesados por Wompi.
            </p>
          </div>
        </div>

        <p className="mt-8 text-xs text-niebla/60">
          © {new Date().getFullYear()} GuíasPC. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
