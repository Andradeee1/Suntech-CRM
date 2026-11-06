import { useState, type ReactNode } from 'react';
import { useUsuarioLogado } from '../contexts/AuthContext';
import { useCrm } from '../contexts/CrmContext';
import { useNegociosDetalhados } from '../hooks/useNegociosDetalhados';
import { FaixaPagina } from '../components/Layout';
import { GraficoBarras, GraficoColunas } from '../components/Graficos';
import { StatusBolinha, TipoBadge } from '../components/Etiquetas';
import { ETAPAS_QUADRO, NOME_ETAPA, NOME_ORIGEM, NOME_TIPO_TAREFA, TIPOS_NEGOCIO } from '../lib/constantes';
import { formatarDia, formatarMoeda, formatarPrazo } from '../lib/formatacao';
import { contarPor, estaAberto, leadsPorMes, somarValores, taxaConversao } from '../lib/regras';
import type { NegocioDetalhado } from '../hooks/useNegociosDetalhados';
import type { Origem, TipoNegocio } from '../types';

export function Dashboard() {
  const usuario = useUsuarioLogado();
  const crm = useCrm();
  const negocios = useNegociosDetalhados();
  const agora = new Date();

  const abertos = negocios.filter(estaAberto);
  const conversao = taxaConversao(negocios);
  const pendentes = crm.dados.tarefas
    .filter((t) => !t.concluida)
    .sort((a, b) => a.dataHora.localeCompare(b.dataHora));
  const atrasadas = pendentes.filter((t) => new Date(t.dataHora) < agora);
  const semVendedor = abertos.filter((n) => n.vendedorId === null);

  const porEtapa = ETAPAS_QUADRO.map((e) => {
    const lista = negocios.filter((n) => n.etapa === e.id);
    return { rotulo: e.nome, valor: lista.length, detalhe: formatarMoeda(somarValores(lista)) };
  });
  const ordemOrigens = Object.keys(NOME_ORIGEM) as Origem[];
  const porOrigem = contarPor(negocios, (n) => n.origem, ordemOrigens)
    .filter((o) => o.total > 0)
    .sort((a, b) => b.total - a.total)
    .map((o) => ({ rotulo: NOME_ORIGEM[o.chave], valor: o.total }));

  const vendedores = crm.dados.usuarios.filter((u) => u.perfil === 'vendedor');

  return (
    <>
      <FaixaPagina
        titulo={usuario.perfil === 'admin' ? 'Visão geral da' : 'Olá,'}
        destaque={usuario.perfil === 'admin' ? 'empresa' : usuario.nome.split(' ')[0]}
        subtitulo={usuario.perfil === 'admin' ? 'Indicadores de toda a equipe.' : 'Seus negócios e tarefas do dia.'}
      />

      <div className="mx-auto max-w-[1440px] space-y-6 px-4 py-6 sm:px-6">
        {/* Indicadores */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Indicador rotulo="Negócios em aberto" valor={String(abertos.length)} nota={`${semVendedor.length} sem vendedor`} />
          <Indicador rotulo="Valor em negociação" valor={formatarMoeda(somarValores(abertos))} nota="Soma dos negócios em aberto" />
          <Indicador
            rotulo="Taxa de conversão"
            valor={conversao == null ? '—' : `${Math.round(conversao * 100)}%`}
            nota="Concluídos ÷ (concluídos + perdidos)"
          />
          <Indicador rotulo="Tarefas atrasadas" valor={String(atrasadas.length)} nota={`${pendentes.length} tarefas pendentes`} alerta={atrasadas.length > 0} />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <LeadsPorMes negocios={negocios} agora={agora} />
          <Cartao titulo="Origem dos leads">
            <GraficoBarras titulo="Leads por origem" itens={porOrigem} />
          </Cartao>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Cartao titulo="Negócios por etapa">
            <GraficoBarras titulo="Negócios por etapa" itens={porEtapa} />
          </Cartao>

          <Cartao titulo="Próximas tarefas" className="lg:col-span-2">
            <ul className="divide-y divide-gray-100">
              {pendentes.slice(0, 7).map((t) => {
                const n = negocios.find((x) => x.id === t.negocioId);
                if (!n) return null;
                const atrasada = new Date(t.dataHora) < agora;
                return (
                  <li key={t.id}>
                    <button type="button" onClick={() => crm.abrirNegocio(n.id)} className="flex w-full items-center gap-3 py-2.5 text-left hover:bg-gray-50">
                      <StatusBolinha status={atrasada ? 'atrasada' : 'agendada'} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-gray-800">
                          {NOME_TIPO_TAREFA[t.tipo]} · {t.descricao}
                        </span>
                        <span className="text-xs text-gray-600">
                          {n.cliente?.nome} · {n.vendedor?.nome.split(' ')[0] ?? 'Sem vendedor'}
                        </span>
                      </span>
                      <TipoBadge tipo={n.tipo} />
                      <span className={`w-24 text-right text-xs ${atrasada ? 'font-semibold text-amber-800' : 'text-gray-600'}`}>
                        {formatarPrazo(t.dataHora, agora)}
                      </span>
                    </button>
                  </li>
                );
              })}
              {pendentes.length === 0 && <li className="py-6 text-center text-sm text-gray-500">Nenhuma tarefa pendente.</li>}
            </ul>
          </Cartao>
        </div>

        {usuario.perfil === 'admin' && (
          <Cartao titulo="Desempenho por vendedor">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-600">
                    <th className="py-2 font-semibold">Vendedor</th>
                    <th className="py-2 text-right font-semibold">Em aberto</th>
                    <th className="py-2 text-right font-semibold">Valor em aberto</th>
                    <th className="py-2 text-right font-semibold">Concluídos</th>
                    <th className="py-2 text-right font-semibold">Valor fechado</th>
                    <th className="py-2 text-right font-semibold">Conversão</th>
                  </tr>
                </thead>
                <tbody>
                  {vendedores.map((v) => {
                    const meus = negocios.filter((n) => n.vendedorId === v.id);
                    const meusAbertos = meus.filter(estaAberto);
                    const concluidos = meus.filter((n) => n.etapa === 'concluido');
                    const taxa = taxaConversao(meus);
                    return (
                      <tr key={v.id} className="border-t border-gray-100">
                        <td className="py-2.5 font-medium">{v.nome}</td>
                        <td className="py-2.5 text-right">{meusAbertos.length}</td>
                        <td className="py-2.5 text-right">{formatarMoeda(somarValores(meusAbertos))}</td>
                        <td className="py-2.5 text-right">{concluidos.length}</td>
                        <td className="py-2.5 text-right">{formatarMoeda(somarValores(concluidos))}</td>
                        <td className="py-2.5 text-right">{taxa == null ? '—' : `${Math.round(taxa * 100)}%`}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Cartao>
        )}
      </div>
    </>
  );
}

function Indicador({ rotulo, valor, nota, alerta = false }: { rotulo: string; valor: string; nota: string; alerta?: boolean }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-600">{rotulo}</p>
      <p className={`mt-1 text-3xl font-bold ${alerta ? 'text-amber-700' : 'text-suntech-green'}`}>{valor}</p>
      <p className="mt-1 text-xs text-gray-500">{nota}</p>
    </div>
  );
}

function Cartao({ titulo, children, className = '' }: { titulo: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-gray-200 bg-white p-5 shadow-sm ${className}`}>
      <h2 className="mb-4 text-base font-semibold text-gray-800">{titulo}</h2>
      {children}
    </section>
  );
}

/** Quantos meses o gráfico mostra. */
const PERIODOS = [6, 12] as const;

/** Mês (no fuso local) em que o negócio entrou, no formato AAAA-MM. */
function mesDe(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function nomeDoMes(chave: string): string {
  const [ano, mes] = chave.split('-').map(Number);
  const texto = new Date(ano!, mes! - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return texto.charAt(0).toUpperCase() + texto.slice(1); // "Agosto de 2026"
}

/** Cartão "Leads por mês": escolhe o período, clica (ou seleciona) um mês e vê os leads dele. */
function LeadsPorMes({ negocios, agora }: { negocios: NegocioDetalhado[]; agora: Date }) {
  const crm = useCrm();
  const [meses, setMeses] = useState<(typeof PERIODOS)[number]>(6);
  const [mesSelecionado, setMesSelecionado] = useState<string | null>(null);

  const serie = leadsPorMes(negocios, meses, agora);
  const itens = serie.map((m) => ({ chave: m.chave, rotulo: m.rotulo, valor: m.total }));
  // Se o período encolher e o mês escolhido sair da janela, a seleção é desfeita.
  const selecionado = mesSelecionado && serie.some((m) => m.chave === mesSelecionado) ? mesSelecionado : null;
  const doMes = selecionado
    ? negocios.filter((n) => mesDe(n.criadoEm) === selecionado).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
    : [];
  const tipos = Object.keys(TIPOS_NEGOCIO) as TipoNegocio[];

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-gray-800">Leads por mês</h2>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            Mês
            <select
              className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm"
              value={selecionado ?? ''}
              onChange={(e) => setMesSelecionado(e.target.value || null)}
            >
              <option value="">Todos</option>
              {[...serie].reverse().map((m) => (
                <option key={m.chave} value={m.chave}>
                  {nomeDoMes(m.chave)}
                </option>
              ))}
            </select>
          </label>
          <div className="flex" role="group" aria-label="Período">
            {PERIODOS.map((p, i) => (
              <button
                key={p}
                type="button"
                aria-pressed={meses === p}
                onClick={() => setMeses(p)}
                className={`border px-3 py-1.5 text-sm ${i === 0 ? 'rounded-l-md' : '-ml-px rounded-r-md'} ${
                  meses === p ? 'border-suntech-green bg-suntech-green text-white' : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-100'
                }`}
              >
                {p} meses
              </button>
            ))}
          </div>
        </div>
      </div>

      <GraficoColunas
        titulo={`Leads por mês, últimos ${meses} meses`}
        itens={itens}
        selecionado={selecionado}
        aoSelecionar={(chave) => setMesSelecionado((atual) => (atual === chave ? null : chave))}
      />

      {selecionado === null ? (
        <p className="mt-4 text-sm text-gray-600">Clique em um mês do gráfico ou escolha no seletor para ver os leads daquele mês.</p>
      ) : (
        <div className="mt-5 border-t border-gray-200 pt-4">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold text-gray-800">
              {nomeDoMes(selecionado)}: {doMes.length} {doMes.length === 1 ? 'lead' : 'leads'}
            </h3>
            <button type="button" className="text-sm text-suntech-green hover:underline" onClick={() => setMesSelecionado(null)}>
              Limpar seleção
            </button>
          </div>

          <dl className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {tipos.map((t) => (
              <div key={t} className="rounded-md bg-gray-50 px-3 py-2">
                <dt className="text-xs text-gray-600">{TIPOS_NEGOCIO[t].nome}</dt>
                <dd className="text-lg font-bold text-gray-800">{doMes.filter((n) => n.tipo === t).length}</dd>
              </div>
            ))}
            <div className="rounded-md bg-gray-50 px-3 py-2">
              <dt className="text-xs text-gray-600">Concluídos</dt>
              <dd className="text-lg font-bold text-gray-800">{doMes.filter((n) => n.etapa === 'concluido').length}</dd>
            </div>
          </dl>

          {doMes.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum lead entrou neste mês.</p>
          ) : (
            <ul className="max-h-64 divide-y divide-gray-100 overflow-y-auto">
              {doMes.map((n) => (
                <li key={n.id}>
                  <button type="button" onClick={() => crm.abrirNegocio(n.id)} className="flex w-full items-center gap-3 py-2 text-left hover:bg-gray-50">
                    <span className="w-12 shrink-0 text-xs text-gray-600">{formatarDia(n.criadoEm)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-gray-800">{n.cliente?.nome}</span>
                      <span className="block truncate text-xs text-gray-600">
                        {NOME_ORIGEM[n.origem]} · {NOME_ETAPA[n.etapa]}
                      </span>
                    </span>
                    <TipoBadge tipo={n.tipo} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
