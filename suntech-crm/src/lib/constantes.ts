import type { Etapa, Origem, TipoNegocio, TipoTarefa } from '../types';

/** Colunas do funil, na ordem em que aparecem. */
export const ETAPAS_FUNIL: { id: Etapa; nome: string; cor: string }[] = [
  { id: 'novo', nome: 'Novo contato', cor: '#9ca3af' },
  { id: 'atendimento', nome: 'Em atendimento', cor: '#ffb700' },
  { id: 'agendado', nome: 'Agendado', cor: '#d97706' },
  { id: 'proposta', nome: 'Proposta enviada', cor: '#4d7c0f' },
  { id: 'concluido', nome: 'Concluído', cor: '#004c01' },
];

export const NOME_ETAPA: Record<Etapa, string> = {
  novo: 'Novo contato',
  atendimento: 'Em atendimento',
  agendado: 'Agendado',
  proposta: 'Proposta enviada',
  concluido: 'Concluído',
  perdido: 'Perdido',
};

export const TIPOS_NEGOCIO: Record<TipoNegocio, { nome: string; classes: string }> = {
  orcamento: { nome: 'Orçamento', classes: 'bg-amber-100 text-amber-900' },
  limpeza: { nome: 'Limpeza de placas', classes: 'bg-green-100 text-suntech-green' },
  atendimento: { nome: 'Atendimento', classes: 'bg-blue-100 text-blue-900' },
};

export const NOME_ORIGEM: Record<Origem, string> = {
  formulario: 'Formulário do site',
  chatbot_orcamento: 'Chatbot (orçamento)',
  chatbot_simulacao: 'Chatbot (simulação)',
  indicacao: 'Indicação',
  base: 'Cliente da base',
  manual: 'Cadastro manual',
};

export const NOME_TIPO_TAREFA: Record<TipoTarefa, string> = {
  ligacao: 'Ligar',
  visita: 'Visita',
  tarefa: 'Tarefa',
};
