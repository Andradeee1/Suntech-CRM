/**
 * Funil em Kanban. Os cards são arrastados com o arrastar-e-soltar nativo do HTML5
 * (sem biblioteca extra). Para teclado e celular, a ficha do cliente tem os botões
 * "Mover para a etapa".
 */
import { useState, type DragEvent } from 'react';
import { useCrm } from '../contexts/CrmContext';
import { ETAPAS_FUNIL } from '../lib/constantes';
import { formatarMoeda, formatarPrazo, formatarValor } from '../lib/formatacao';
import { somarValores } from '../lib/regras';
import type { NegocioDetalhado } from '../hooks/useNegociosDetalhados';
import type { Etapa, TipoTarefa } from '../types';
import { StatusBolinha, TipoBadge } from './Etiquetas';
import { Icone, type NomeIcone } from './Icone';

const ICONE_TAREFA: Record<TipoTarefa, NomeIcone> = { ligacao: 'telefone', visita: 'local', tarefa: 'tarefa' };

export function KanbanBoard({ negocios }: { negocios: NegocioDetalhado[] }) {
  const { moverNegocio } = useCrm();
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [sobre, setSobre] = useState<Etapa | null>(null);

  function soltar(e: DragEvent, etapa: Etapa) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || arrastando;
    setArrastando(null);
    setSobre(null);
    const negocio = negocios.find((n) => n.id === id);
    if (negocio && negocio.etapa !== etapa) void moverNegocio(negocio.id, etapa);
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="grid min-w-[1310px] grid-cols-5 gap-3.5">
        {ETAPAS_FUNIL.map((etapa) => {
          const cards = negocios.filter((n) => n.etapa === etapa.id);
          const destacado = sobre === etapa.id && arrastando !== null;
          return (
            <section
              key={etapa.id}
              aria-label={etapa.nome}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (sobre !== etapa.id) setSobre(etapa.id);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setSobre(null);
              }}
              onDrop={(e) => soltar(e, etapa.id)}
              className={`rounded-xl p-2.5 outline-2 outline-dashed transition-colors ${
                destacado ? 'bg-amber-50 outline-suntech-yellow' : 'bg-gray-100 outline-transparent'
              }`}
            >
              <header className="px-1 pb-2.5" style={{ borderBottom: `3px solid ${etapa.cor}` }}>
                <h2 className="text-[15px] font-bold text-gray-800">{etapa.nome}</h2>
                <p className="text-xs text-gray-600">
                  {formatarMoeda(somarValores(cards))} · {cards.length} {cards.length === 1 ? 'negócio' : 'negócios'}
                </p>
              </header>

              <ul className="flex min-h-[420px] flex-col gap-2.5 pt-2.5">
                {cards.map((n) => (
                  <li key={n.id}>
                    <CardNegocio
                      negocio={n}
                      esmaecido={arrastando === n.id}
                      aoIniciar={() => setArrastando(n.id)}
                      aoTerminar={() => {
                        setArrastando(null);
                        setSobre(null);
                      }}
                    />
                  </li>
                ))}
                {cards.length === 0 && (
                  <li className="rounded-lg border-2 border-dashed border-gray-300 px-3 py-6 text-center text-sm text-gray-500">
                    Arraste um card para cá
                  </li>
                )}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function CardNegocio({
  negocio: n,
  esmaecido,
  aoIniciar,
  aoTerminar,
}: {
  negocio: NegocioDetalhado;
  esmaecido: boolean;
  aoIniciar: () => void;
  aoTerminar: () => void;
}) {
  const { abrirNegocio } = useCrm();
  const corAcao = n.status === 'atrasada' ? 'text-amber-700' : n.status === 'agendada' ? 'text-green-700' : 'text-gray-500';

  return (
    <button
      type="button"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', n.id);
        e.dataTransfer.effectAllowed = 'move';
        aoIniciar();
      }}
      onDragEnd={aoTerminar}
      onClick={() => abrirNegocio(n.id)}
      aria-label={`${n.cliente?.nome ?? 'Cliente'}, ${n.titulo}. Abrir ficha`}
      className={`flex w-full cursor-grab flex-col gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-3 text-left shadow-sm transition hover:border-suntech-yellow hover:shadow-md active:cursor-grabbing ${
        esmaecido ? 'opacity-40' : ''
      }`}
    >
      <span className="flex items-center gap-2">
        {n.etapa === 'concluido' && n.status === 'sem' ? (
          <span className="inline-block size-2.5 shrink-0 rounded-full bg-gray-300" title="Negócio concluído" />
        ) : (
          <StatusBolinha status={n.status} />
        )}
        <span className="truncate text-sm font-semibold text-gray-800">{n.cliente?.nome ?? 'Cliente'}</span>
      </span>
      <span className="text-[13px] text-gray-600">{n.titulo}</span>
      <span className="flex items-center justify-between gap-2">
        <TipoBadge tipo={n.tipo} />
        <span className={`text-sm font-bold ${n.valor == null ? 'font-medium text-gray-500' : 'text-gray-800'}`}>
          {formatarValor(n.valor)}
        </span>
      </span>
      <span className="flex items-center justify-between gap-2 border-t border-gray-100 pt-2 text-xs">
        <span className={n.vendedor ? 'text-gray-600' : 'font-semibold text-red-700'}>
          {n.vendedor ? n.vendedor.nome.split(' ')[0] : 'Sem vendedor'}
        </span>
        <span className={`inline-flex items-center gap-1.5 ${corAcao}`}>
          {n.proxima ? (
            <>
              <Icone nome={ICONE_TAREFA[n.proxima.tipo]} className="size-3.5" />
              {formatarPrazo(n.proxima.dataHora)}
            </>
          ) : n.etapa === 'concluido' ? (
            'Finalizado'
          ) : (
            'Sem tarefa'
          )}
        </span>
      </span>
    </button>
  );
}
