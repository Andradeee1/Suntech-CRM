/**
 * Regras de negócio do CRM, em funções puras (sem React e sem banco),
 * para que possam ser testadas isoladamente (ver regras.test.ts).
 */
import type { Etapa, Negocio, StatusTarefa, Tarefa, Usuario } from '../types';

// ---------------------------------------------------------------------------
// Permissões
// No Supabase, estas mesmas regras serão escritas como políticas RLS no banco.
// Aqui elas servem para a interface e para a camada de dados local.
// ---------------------------------------------------------------------------

/** Admin vê tudo. Vendedor vê os negócios dele e os que ainda não têm vendedor. */
export function podeVerNegocio(usuario: Usuario, negocio: Negocio): boolean {
  if (usuario.perfil === 'admin') return true;
  return negocio.vendedorId === usuario.id || negocio.vendedorId === null;
}

/** Admin edita tudo. Vendedor só edita os negócios que são dele. */
export function podeEditarNegocio(usuario: Usuario, negocio: Negocio): boolean {
  if (usuario.perfil === 'admin') return true;
  return negocio.vendedorId === usuario.id;
}

/** Vendedor pode "assumir" um lead que ainda não tem vendedor. */
export function podeAssumirNegocio(usuario: Usuario, negocio: Negocio): boolean {
  return usuario.ativo && negocio.vendedorId === null;
}

/** Só o admin troca o vendedor responsável e gerencia usuários. */
export function podeGerenciar(usuario: Usuario): boolean {
  return usuario.perfil === 'admin';
}

// ---------------------------------------------------------------------------
// Tarefas
// ---------------------------------------------------------------------------

/** Tarefas pendentes de um negócio, da mais próxima para a mais distante. */
export function tarefasPendentes(tarefas: Tarefa[], negocioId: string): Tarefa[] {
  return tarefas
    .filter((t) => t.negocioId === negocioId && !t.concluida)
    .sort((a, b) => a.dataHora.localeCompare(b.dataHora));
}

/**
 * Status mostrado na bolinha do card:
 * - "atrasada": existe tarefa pendente com data no passado
 * - "agendada": existem tarefas pendentes, todas no futuro
 * - "sem": nenhuma tarefa pendente
 */
export function statusTarefas(tarefas: Tarefa[], negocioId: string, agora: Date = new Date()): StatusTarefa {
  const pendentes = tarefasPendentes(tarefas, negocioId);
  if (pendentes.length === 0) return 'sem';
  const atrasada = pendentes.some((t) => new Date(t.dataHora).getTime() < agora.getTime());
  return atrasada ? 'atrasada' : 'agendada';
}

/** A tarefa que aparece no card: a pendente mais antiga (atrasada ou próxima). */
export function proximaTarefa(tarefas: Tarefa[], negocioId: string): Tarefa | null {
  return tarefasPendentes(tarefas, negocioId)[0] ?? null;
}

// ---------------------------------------------------------------------------
// Funil e indicadores do dashboard
// ---------------------------------------------------------------------------

export const ETAPAS_FECHADAS: Etapa[] = ['concluido', 'perdido'];

export function estaAberto(negocio: Negocio): boolean {
  return !ETAPAS_FECHADAS.includes(negocio.etapa);
}

export function somarValores(negocios: Negocio[]): number {
  return negocios.reduce((soma, n) => soma + (n.valor ?? 0), 0);
}

/**
 * Taxa de conversão = concluídos / (concluídos + perdidos).
 * Retorna null quando ainda não há negócio fechado (evita divisão por zero).
 */
export function taxaConversao(negocios: Negocio[]): number | null {
  const concluidos = negocios.filter((n) => n.etapa === 'concluido').length;
  const perdidos = negocios.filter((n) => n.etapa === 'perdido').length;
  const fechados = concluidos + perdidos;
  return fechados === 0 ? null : concluidos / fechados;
}

/** Quantidade de negócios criados em cada um dos últimos `meses` meses (o atual incluso). */
export function leadsPorMes(
  negocios: Negocio[],
  meses = 6,
  agora: Date = new Date(),
): { chave: string; rotulo: string; total: number }[] {
  const resultado: { chave: string; rotulo: string; total: number }[] = [];
  for (let i = meses - 1; i >= 0; i--) {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
    const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const rotulo = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
    resultado.push({ chave, rotulo, total: 0 });
  }
  for (const n of negocios) {
    const d = new Date(n.criadoEm); // mês no fuso local, igual ao dos rótulos
    const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const item = resultado.find((r) => r.chave === chave);
    if (item) item.total += 1;
  }
  return resultado;
}

/** Conta itens por uma chave, mantendo a ordem dada em `ordem`. */
export function contarPor<T, K extends string>(itens: T[], chave: (item: T) => K, ordem: K[]): { chave: K; total: number }[] {
  return ordem.map((k) => ({ chave: k, total: itens.filter((i) => chave(i) === k).length }));
}
