import { useMemo } from 'react';
import { useCrm } from '../contexts/CrmContext';
import { proximaTarefa, statusTarefas } from '../lib/regras';
import type { Cliente, Negocio, StatusTarefa, Tarefa, Usuario } from '../types';

/** Negócio já "juntado" com cliente, vendedor e situação das tarefas (o que os cards precisam). */
export interface NegocioDetalhado extends Negocio {
  cliente: Cliente | undefined;
  vendedor: Usuario | undefined;
  status: StatusTarefa;
  proxima: Tarefa | null;
}

export function useNegociosDetalhados(): NegocioDetalhado[] {
  const { dados, clientePorId, usuarioPorId } = useCrm();
  return useMemo(() => {
    const agora = new Date();
    return dados.negocios.map((n) => ({
      ...n,
      cliente: clientePorId(n.clienteId),
      vendedor: usuarioPorId(n.vendedorId),
      status: statusTarefas(dados.tarefas, n.id, agora),
      proxima: proximaTarefa(dados.tarefas, n.id),
    }));
  }, [dados, clientePorId, usuarioPorId]);
}
