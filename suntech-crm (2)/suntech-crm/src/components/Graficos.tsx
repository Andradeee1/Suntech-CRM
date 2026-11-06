/**
 * Gráficos simples em HTML/CSS (sem biblioteca), uma única série em verde SunTech.
 * Cada barra mostra o valor exato ao passar o mouse ou focar com o teclado.
 */

interface Item {
  rotulo: string;
  valor: number;
  detalhe?: string;
  chave?: string;
}

/**
 * Colunas verticais (ex.: leads por mês).
 * Com `aoSelecionar`, cada coluna vira um botão: clicar seleciona o mês e
 * as demais colunas ficam mais claras.
 */
export function GraficoColunas({
  itens,
  titulo,
  selecionado = null,
  aoSelecionar,
}: {
  itens: Item[];
  titulo: string;
  selecionado?: string | null;
  aoSelecionar?: (chave: string) => void;
}) {
  const max = Math.max(1, ...itens.map((i) => i.valor));
  return (
    <figure aria-label={titulo}>
      <div className="flex h-72 items-end gap-2 border-b border-gray-300 px-1 pt-8 sm:gap-3">
        {itens.map((i) => {
          const chave = i.chave ?? i.rotulo;
          const ativo = selecionado === chave;
          const apagado = selecionado !== null && !ativo;
          const cor = ativo ? 'bg-suntech-yellow' : apagado ? 'bg-suntech-green/30' : 'bg-suntech-green';
          const barra = (
            <span
              className={`block w-full max-w-9 rounded-t transition-colors ${cor} group-hover:brightness-90`}
              style={{ height: `${(i.valor / max) * 100}%`, minHeight: i.valor > 0 ? 4 : 0 }}
            />
          );
          return (
            <div key={chave} className="group relative flex h-full flex-1 flex-col items-center justify-end">
              {aoSelecionar ? (
                <button
                  type="button"
                  onClick={() => aoSelecionar(chave)}
                  aria-pressed={ativo}
                  aria-label={`${i.rotulo}: ${i.valor}. Ver detalhes do mês`}
                  className="flex h-full w-full cursor-pointer flex-col items-center justify-end rounded-t hover:bg-gray-50"
                >
                  {barra}
                </button>
              ) : (
                <span tabIndex={0} role="img" aria-label={`${i.rotulo}: ${i.valor}`} className="flex h-full w-full flex-col items-center justify-end">
                  {barra}
                </span>
              )}
              <span className="pointer-events-none absolute -top-1 hidden -translate-y-full whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white group-hover:block group-has-[:focus-visible]:block">
                {i.rotulo}: <strong>{i.valor}</strong>
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2 px-1 sm:gap-3">
        {itens.map((i) => {
          const ativo = selecionado === (i.chave ?? i.rotulo);
          return (
            <span key={i.chave ?? i.rotulo} className={`flex-1 text-center text-xs capitalize ${ativo ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
              {i.rotulo}
            </span>
          );
        })}
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
