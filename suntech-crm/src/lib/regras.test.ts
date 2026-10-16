import { describe, expect, it } from 'vitest';
import type { Negocio, Tarefa, Usuario } from '../types';
import {
  leadsPorMes,
  podeAssumirNegocio,
  podeEditarNegocio,
  podeVerNegocio,
  proximaTarefa,
  statusTarefas,
  taxaConversao,
} from './regras';

const admin: Usuario = { id: 'u1', nome: 'Admin', email: 'a@x', perfil: 'admin', ativo: true };
const marina: Usuario = { id: 'u2', nome: 'Marina', email: 'm@x', perfil: 'vendedor', ativo: true };

function negocio(parcial: Partial<Negocio>): Negocio {
  return {
    id: 'n1',
    clienteId: 'c1',
    tipo: 'orcamento',
    titulo: 'Residencial',
    valor: 1000,
    kwp: null,
    etapa: 'novo',
    vendedorId: null,
    origem: 'formulario',
    criadoEm: '2026-10-01T10:00:00.000Z',
    atualizadoEm: '2026-10-01T10:00:00.000Z',
    ...parcial,
  };
}

function tarefa(parcial: Partial<Tarefa>): Tarefa {
  return {
    id: 't1',
    negocioId: 'n1',
    tipo: 'ligacao',
    descricao: 'Ligar',
    dataHora: '2026-10-15T12:00:00.000Z',
    concluida: false,
    responsavelId: 'u2',
    ...parcial,
  };
}

describe('permissões', () => {
  it('admin vê e edita qualquer negócio', () => {
    const n = negocio({ vendedorId: 'outro' });
    expect(podeVerNegocio(admin, n)).toBe(true);
    expect(podeEditarNegocio(admin, n)).toBe(true);
  });

  it('vendedor vê os seus e os sem vendedor, mas não os de outro vendedor', () => {
    expect(podeVerNegocio(marina, negocio({ vendedorId: 'u2' }))).toBe(true);
    expect(podeVerNegocio(marina, negocio({ vendedorId: null }))).toBe(true);
    expect(podeVerNegocio(marina, negocio({ vendedorId: 'u3' }))).toBe(false);
  });

  it('vendedor só edita os seus e pode assumir lead sem vendedor', () => {
    expect(podeEditarNegocio(marina, negocio({ vendedorId: null }))).toBe(false);
    expect(podeAssumirNegocio(marina, negocio({ vendedorId: null }))).toBe(true);
    expect(podeAssumirNegocio(marina, negocio({ vendedorId: 'u3' }))).toBe(false);
  });
});

describe('status das tarefas', () => {
  const agora = new Date('2026-10-15T15:00:00.000Z');

  it('sem tarefas pendentes => "sem"', () => {
    expect(statusTarefas([tarefa({ concluida: true })], 'n1', agora)).toBe('sem');
  });

  it('tarefa pendente no passado => "atrasada"', () => {
    expect(statusTarefas([tarefa({ dataHora: '2026-10-14T12:00:00.000Z' })], 'n1', agora)).toBe('atrasada');
  });

  it('só tarefas futuras => "agendada"', () => {
    expect(statusTarefas([tarefa({ dataHora: '2026-10-16T12:00:00.000Z' })], 'n1', agora)).toBe('agendada');
  });

  it('próxima tarefa é a pendente mais antiga', () => {
    const lista = [
      tarefa({ id: 'a', dataHora: '2026-10-20T12:00:00.000Z' }),
      tarefa({ id: 'b', dataHora: '2026-10-16T12:00:00.000Z' }),
      tarefa({ id: 'c', dataHora: '2026-10-10T12:00:00.000Z', concluida: true }),
    ];
    expect(proximaTarefa(lista, 'n1')?.id).toBe('b');
  });
});

describe('indicadores', () => {
  it('taxa de conversão considera só negócios fechados', () => {
    const lista = [
      negocio({ etapa: 'concluido' }),
      negocio({ etapa: 'concluido' }),
      negocio({ etapa: 'perdido' }),
      negocio({ etapa: 'proposta' }),
    ];
    expect(taxaConversao(lista)).toBeCloseTo(2 / 3);
    expect(taxaConversao([negocio({ etapa: 'novo' })])).toBeNull();
  });

  it('leads por mês agrupa pelos últimos meses', () => {
    const agora = new Date(2026, 9, 15); // outubro de 2026
    const lista = [
      negocio({ criadoEm: '2026-10-02T10:00:00.000Z' }),
      negocio({ criadoEm: '2026-10-09T10:00:00.000Z' }),
      negocio({ criadoEm: '2026-08-20T10:00:00.000Z' }),
      negocio({ criadoEm: '2025-01-01T10:00:00.000Z' }), // fora da janela
    ];
    const meses = leadsPorMes(lista, 6, agora);
    expect(meses).toHaveLength(6);
    expect(meses[5]).toMatchObject({ chave: '2026-10', total: 2 });
    expect(meses[3]).toMatchObject({ chave: '2026-08', total: 1 });
  });
});
