/**
 * Gráficos simples em HTML/CSS (sem biblioteca), uma única série em verde SunTech.
 * Cada barra mostra o valor exato ao passar o mouse ou focar com o teclado.
 */

interface Item {
  rotulo: string;
  valor: number;
  detalhe?: string;
}

/** Colunas verticais (ex.: leads por mês). */
export function GraficoColunas({ itens, titulo }: { itens: Item[]; titulo: string }) {
  const max = Math.max(1, ...itens.map((i) => i.valor));
  return (
    <figure aria-label={titulo}>
      <div className="flex h-64 items-end gap-3 border-b border-gray-300 px-1">
        {itens.map((i) => (
          <div key={i.rotulo} className="group relative flex h-full flex-1 flex-col items-center justify-end">
            <span
              tabIndex={0}
              role="img"
              aria-label={`${i.rotulo}: ${i.valor}`}
              className="w-full max-w-9 rounded-t bg-suntech-green transition-colors group-hover:bg-suntech-green-dark"
              style={{ height: `${(i.valor / max) * 100}%`, minHeight: i.valor > 0 ? 4 : 0 }}
            />
            <span className="pointer-events-none absolute -top-1 hidden -translate-y-full whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white group-focus-within:block group-hover:block">
              {i.rotulo}: <strong>{i.valor}</strong>
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-3 px-1">
        {itens.map((i) => (
          <span key={i.rotulo} className="flex-1 text-center text-xs capitalize text-gray-600">
            {i.rotulo}
          </span>
        ))}
      </div>
    </figure>
  );
}

/** Barras horizontais com o valor escrito ao lado (ex.: negócios por etapa). */
export function GraficoBarras({ itens, titulo }: { itens: Item[]; titulo: string }) {
  const max = Math.max(1, ...itens.map((i) => i.valor));
  return (
    <figure aria-label={titulo}>
      <ul className="space-y-3">
        {itens.map((i) => (
          <li key={i.rotulo} className="grid grid-cols-[minmax(0,130px)_1fr] items-center gap-3 text-sm">
            <span className="truncate text-gray-700">{i.rotulo}</span>
            <span className="flex items-center gap-2" title={i.detalhe}>
              <span className="h-3 rounded-r bg-suntech-green" style={{ width: `${(i.valor / max) * 100}%`, minWidth: i.valor > 0 ? 4 : 0 }} />
              <span className="whitespace-nowrap text-xs font-semibold text-gray-800">
                {i.valor}
                {i.detalhe && <span className="ml-1 font-normal text-gray-600">· {i.detalhe}</span>}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
