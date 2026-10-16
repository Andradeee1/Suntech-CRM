import type { ReactNode } from 'react';
import { useUsuarioLogado } from '../contexts/AuthContext';
import { useCrm } from '../contexts/CrmContext';
import { useNegociosDetalhados } from '../hooks/useNegociosDetalhados';
import { FaixaPagina } from '../components/Layout';
import { GraficoBarras, GraficoColunas } from '../components/Graficos';
import { StatusBolinha, TipoBadge } from '../components/Etiquetas';
import { Icone } from '../components/Icone';
import { ETAPAS_FUNIL, NOME_ORIGEM, NOME_TIPO_TAREFA } from '../lib/constantes';
import { formatarMoeda, formatarPrazo } from '../lib/formatacao';
import { contarPor, estaAberto, leadsPorMes, somarValores, taxaConversao } from '../lib/regras';
import type { Origem } from '../types';

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

  const porMes = leadsPorMes(negocios, 6, agora).map((m) => ({ rotulo: m.rotulo, valor: m.total }));
  const porEtapa = ETAPAS_FUNIL.map((e) => {
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
      >
        <button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-md bg-suntech-yellow px-4 py-2.5 text-sm font-bold text-gray-900 hover:bg-suntech-yellow-dark" onClick={() => crm.abrirNovoNegocio()}>
          <Icone nome="mais" />
          Adicionar negócio
        </button>
      </FaixaPagina>

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
          <Cartao titulo="Leads por mês" className="lg:col-span-2">
            <GraficoColunas titulo="Leads por mês, últimos 6 meses" itens={porMes} />
          </Cartao>
          <Cartao titulo="Origem dos leads">
            <GraficoBarras titulo="Leads por origem" itens={porOrigem} />
          </Cartao>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Cartao titulo="Funil por etapa">
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
