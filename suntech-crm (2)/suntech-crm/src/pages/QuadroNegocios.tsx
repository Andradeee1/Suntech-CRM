import { useMemo, useState } from 'react';
import { useUsuarioLogado } from '../contexts/AuthContext';
import { useCrm } from '../contexts/CrmContext';
import { useNegociosDetalhados, type NegocioDetalhado } from '../hooks/useNegociosDetalhados';
import { KanbanBoard } from '../components/KanbanBoard';
import { FaixaPagina } from '../components/Layout';
import { botao, campo } from '../components/Botoes';
import { LegendaStatus, StatusBolinha, TipoBadge } from '../components/Etiquetas';
import { Icone } from '../components/Icone';
import { NOME_ETAPA, NOME_ORIGEM, TIPOS_NEGOCIO } from '../lib/constantes';
import { baixarArquivo, gerarCsv } from '../lib/csv';
import { formatarDia, formatarMoeda, formatarPrazo, formatarValor } from '../lib/formatacao';
import { somarValores } from '../lib/regras';
import type { TipoNegocio } from '../types';

type FiltroTipo = 'todos' | TipoNegocio;

/** Botão do seletor Listagem/Quadro: verde quando ativo, branco quando não. */
function alternador(ativo: boolean): string {
  const base = 'inline-flex min-h-10 items-center gap-2 border px-3.5 py-2 text-sm font-medium transition-colors';
  return ativo
    ? `${base} border-suntech-green bg-suntech-green text-white`
    : `${base} border-gray-300 bg-white text-gray-800 hover:bg-gray-100`;
}

/** Tela "Quadro de negócios": o quadro em colunas (Kanban) e a listagem. */
export function QuadroNegocios() {
  const usuario = useUsuarioLogado();
  const crm = useCrm();
  const todos = useNegociosDetalhados();

  const [busca, setBusca] = useState('');
  const [tipo, setTipo] = useState<FiltroTipo>('todos');
  const [vendedor, setVendedor] = useState('todos');
  const [visao, setVisao] = useState<'quadro' | 'lista'>('quadro');

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return todos.filter((n) => {
      if (tipo !== 'todos' && n.tipo !== tipo) return false;
      if (vendedor === 'sem' && n.vendedorId !== null) return false;
      if (vendedor !== 'todos' && vendedor !== 'sem' && n.vendedorId !== vendedor) return false;
      if (termo && !`${n.cliente?.nome ?? ''} ${n.titulo} ${n.cliente?.cidade ?? ''}`.toLowerCase().includes(termo)) return false;
      return true;
    });
  }, [todos, busca, tipo, vendedor]);

  const noQuadro = filtrados.filter((n) => n.etapa !== 'perdido');

  function exportar() {
    const linhas = [
      ['Cliente', 'Telefone', 'Cidade', 'Tipo', 'Descrição', 'Etapa', 'Valor', 'Vendedor', 'Origem', 'Entrada'],
      ...filtrados.map((n) => [
        n.cliente?.nome ?? '',
        n.cliente?.telefone ?? '',
        n.cliente?.cidade ?? '',
        TIPOS_NEGOCIO[n.tipo].nome,
        n.titulo,
        NOME_ETAPA[n.etapa],
        n.valor,
        n.vendedor?.nome ?? 'Sem vendedor',
        NOME_ORIGEM[n.origem],
        formatarDia(n.criadoEm),
      ]),
    ];
    baixarArquivo(`negocios-suntech-${new Date().toLocaleDateString('sv-SE')}.csv`, gerarCsv(linhas));
  }

  const pilulas: { id: FiltroTipo; nome: string; ativo: string; inativo: string }[] = [
    { id: 'todos', nome: 'Todos', ativo: 'bg-suntech-green text-white border-suntech-green', inativo: 'bg-white text-gray-800' },
    { id: 'orcamento', nome: 'Orçamento', ativo: 'bg-suntech-yellow text-gray-900 border-suntech-yellow', inativo: TIPOS_NEGOCIO.orcamento.classes },
    { id: 'limpeza', nome: 'Limpeza de placas', ativo: 'bg-suntech-green text-white border-suntech-green', inativo: TIPOS_NEGOCIO.limpeza.classes },
    { id: 'atendimento', nome: 'Atendimento', ativo: 'bg-blue-800 text-white border-blue-800', inativo: TIPOS_NEGOCIO.atendimento.classes },
  ];

  return (
    <>
      <FaixaPagina titulo="Quadro de" destaque="negócios" subtitulo="Orçamentos, limpezas de placas e atendimentos em um só lugar.">
        <div className="mr-2 flex items-baseline gap-2.5">
          <span className="text-4xl font-bold leading-none">{noQuadro.length}</span>
          <span className="flex flex-col text-[13px] leading-tight">
            <span className="opacity-85">negócios</span>
            <strong className="text-base">{formatarMoeda(somarValores(noQuadro))}</strong>
          </span>
        </div>
        <button type="button" className={botao.contornoClaro} disabled title="Em breve: importação da planilha de clientes (Fase 2)">
          <Icone nome="importar" />
          Importar
        </button>
        <button type="button" className={botao.contornoClaro} onClick={exportar}>
          <Icone nome="exportar" />
          Exportar
        </button>
        <button type="button" className={botao.principal} onClick={() => crm.abrirNovoNegocio()}>
          <Icone nome="mais" />
          Adicionar negócio
        </button>
      </FaixaPagina>

      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3.5 px-4 pb-2 pt-5 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative flex items-center">
            <span className="sr-only">Buscar</span>
            <Icone nome="busca" className="pointer-events-none absolute left-3 size-4 text-gray-500" />
            <input
              type="search"
              className={`${campo} w-72 max-w-full pl-9`}
              placeholder="Buscar por cliente, serviço ou cidade"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por tipo">
            {pilulas.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={tipo === p.id}
                onClick={() => setTipo(p.id)}
                className={`min-h-9 rounded-full border px-3.5 text-[13px] font-medium ${tipo === p.id ? p.ativo : `border-gray-200 ${p.inativo}`}`}
              >
                {p.nome}
              </button>
            ))}
          </div>
          {usuario.perfil === 'admin' && (
            <label>
              <span className="sr-only">Filtrar por vendedor</span>
              <select className={`${campo} w-auto`} value={vendedor} onChange={(e) => setVendedor(e.target.value)}>
                <option value="todos">Todos os vendedores</option>
                <option value="sem">Sem vendedor</option>
                {crm.dados.usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={botao.neutro}
            onClick={() => void crm.simularLeadDoSite()}
            title="Cria um lead como se alguém tivesse preenchido o formulário ou o chatbot do site"
          >
            <Icone nome="globo" />
            Simular lead do site
          </button>
          <div className="flex" role="group" aria-label="Modo de visualização">
            <button
              type="button"
              aria-pressed={visao === 'lista'}
              onClick={() => setVisao('lista')}
              className={`${alternador(visao === 'lista')} rounded-l-md`}
            >
              <Icone nome="lista" />
              Listagem
            </button>
            <button
              type="button"
              aria-pressed={visao === 'quadro'}
              onClick={() => setVisao('quadro')}
              className={`${alternador(visao === 'quadro')} -ml-px rounded-r-md`}
            >
              <Icone nome="quadro" />
              Quadro
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-4 py-2 sm:px-6">
        {crm.carregando ? (
          <p className="py-20 text-center text-gray-600">Carregando…</p>
        ) : visao === 'quadro' ? (
          <KanbanBoard negocios={noQuadro} />
        ) : (
          <Listagem negocios={filtrados} />
        )}
      </div>

      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4 pb-8 pt-2 sm:px-6">
        <LegendaStatus />
        <p className="text-sm text-gray-600">Arraste os cards entre as etapas ou clique para abrir a ficha.</p>
      </div>
    </>
  );
}

function Listagem({ negocios }: { negocios: NegocioDetalhado[] }) {
  const { abrirNegocio } = useCrm();
  const ordenados = [...negocios].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="w-full min-w-[960px] border-collapse text-sm">
        <thead>
          <tr className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-600">
            {['Cliente', 'Tipo', 'Etapa', 'Valor', 'Vendedor', 'Próxima ação', 'Origem', 'Entrada'].map((c) => (
              <th key={c} className="px-4 py-3 font-semibold">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ordenados.map((n) => (
            <tr key={n.id} className="border-t border-gray-100 hover:bg-amber-50/50">
              <td className="px-4 py-3">
                <button type="button" onClick={() => abrirNegocio(n.id)} className="text-left">
                  <span className="block font-semibold text-suntech-green hover:underline">{n.cliente?.nome}</span>
                  <span className="text-xs text-gray-600">{n.titulo}</span>
                </button>
              </td>
              <td className="px-4 py-3">
                <TipoBadge tipo={n.tipo} />
              </td>
              <td className={`px-4 py-3 ${n.etapa === 'perdido' ? 'text-red-700' : ''}`}>{NOME_ETAPA[n.etapa]}</td>
              <td className="px-4 py-3 font-semibold">{formatarValor(n.valor)}</td>
              <td className="px-4 py-3">{n.vendedor?.nome ?? <span className="font-semibold text-red-700">Sem vendedor</span>}</td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-2">
                  <StatusBolinha status={n.status} />
                  {n.proxima ? `${n.proxima.descricao} · ${formatarPrazo(n.proxima.dataHora)}` : 'Sem tarefa'}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600">{NOME_ORIGEM[n.origem]}</td>
              <td className="px-4 py-3 text-gray-600">{formatarDia(n.criadoEm)}</td>
            </tr>
          ))}
          {ordenados.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                Nenhum negócio encontrado com esses filtros.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
