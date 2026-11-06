/** Pequenos componentes visuais reutilizados em várias telas. */
import { TIPOS_NEGOCIO } from '../lib/constantes';
import { iniciais } from '../lib/formatacao';
import type { StatusTarefa, TipoNegocio } from '../types';

export function TipoBadge({ tipo }: { tipo: TipoNegocio }) {
  const t = TIPOS_NEGOCIO[tipo];
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${t.classes}`}>{t.nome}</span>;
}

const COR_STATUS: Record<StatusTarefa, string> = {
  agendada: 'bg-green-700',
  atrasada: 'bg-suntech-yellow',
  sem: 'bg-red-600',
};

export const DESCRICAO_STATUS: Record<StatusTarefa, string> = {
  agendada: 'Com tarefa agendada',
  atrasada: 'Tarefa atrasada',
  sem: 'Sem tarefa agendada',
};

export function StatusBolinha({ status, className = 'size-2.5' }: { status: StatusTarefa; className?: string }) {
  return <span className={`inline-block shrink-0 rounded-full ${COR_STATUS[status]} ${className}`} title={DESCRICAO_STATUS[status]} />;
}

export function LegendaStatus() {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600" aria-label="Legenda">
      {(Object.keys(COR_STATUS) as StatusTarefa[]).map((s) => (
        <li key={s} className="inline-flex items-center gap-2">
          <StatusBolinha status={s} />
          {DESCRICAO_STATUS[s]}
        </li>
      ))}
    </ul>
  );
}

export function Avatar({ nome, className = 'size-9 text-sm' }: { nome: string; className?: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full bg-suntech-green font-bold text-white ${className}`}>
      {iniciais(nome)}
    </span>
  );
}
