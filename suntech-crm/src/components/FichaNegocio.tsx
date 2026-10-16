/** Ficha do cliente/negócio: painel lateral aberto ao clicar num card ou numa linha. */
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useUsuarioLogado } from '../contexts/AuthContext';
import { useCrm } from '../contexts/CrmContext';
import { useNegociosDetalhados } from '../hooks/useNegociosDetalhados';
import { ETAPAS_FUNIL, NOME_ETAPA, NOME_ORIGEM, NOME_TIPO_TAREFA, TIPOS_NEGOCIO } from '../lib/constantes';
import { formatarDataHora, formatarDia, formatarValor, lerValor, linkWhatsApp } from '../lib/formatacao';
import { podeAssumirNegocio, podeEditarNegocio, podeGerenciar, tarefasPendentes } from '../lib/regras';
import type { TipoNegocio, TipoTarefa } from '../types';
import { botao, campo, rotulo } from './Botoes';
import { DESCRICAO_STATUS, StatusBolinha, TipoBadge } from './Etiquetas';
import { Icone } from './Icone';

export function FichaNegocio() {
  const { negocioAbertoId, fecharNegocio } = useCrm();
  const negocio = useNegociosDetalhados().find((n) => n.id === negocioAbertoId);

  useEffect(() => {
    if (!negocioAbertoId) return;
    const aoTeclar = (e: KeyboardEvent) => e.key === 'Escape' && fecharNegocio();
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [negocioAbertoId, fecharNegocio]);

  if (!negocio) return null;
  // A key força o conteúdo a reiniciar (formulários limpos) ao trocar de negócio.
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-gray-900/40" onClick={fecharNegocio}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Ficha de ${negocio.cliente?.nome ?? 'cliente'}`}
        className="flex h-full w-full max-w-[460px] flex-col overflow-y-auto bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <ConteudoFicha key={negocio.id} negocioId={negocio.id} />
      </aside>
    </div>
  );
}

function ConteudoFicha({ negocioId }: { negocioId: string }) {
  const usuario = useUsuarioLogado();
  const crm = useCrm();
  const n = useNegociosDetalhados().find((x) => x.id === negocioId)!;
  const podeEditar = podeEditarNegocio(usuario, n);
  const admin = podeGerenciar(usuario);
  const vendedores = crm.dados.usuarios.filter((u) => u.ativo);
  const pendentes = tarefasPendentes(crm.dados.tarefas, n.id);
  const historico = crm.dados.interacoes
    .filter((i) => i.negocioId === n.id)
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));

  const [editando, setEditando] = useState(false);

  return (
    <>
      <div className="flex items-start justify-between gap-3 bg-suntech-green px-6 py-5 text-white">
        <div className="space-y-1.5">
          <p className="text-xs opacity-85">Ficha do cliente</p>
          <h2 className="text-2xl font-bold">{n.cliente?.nome}</h2>
          <p className="text-sm opacity-90">{n.titulo}</p>
        </div>
        <button
          type="button"
          onClick={crm.fecharNegocio}
          className="inline-flex size-11 items-center justify-center rounded-md hover:bg-white/10"
          aria-label="Fechar ficha"
        >
          <Icone nome="fechar" className="size-5" />
        </button>
      </div>

      <div className="flex flex-col gap-6 px-6 py-5">
        {n.vendedorId === null && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-800">Este lead ainda não tem vendedor responsável.</p>
            {podeAssumirNegocio(usuario, n) && !admin && (
              <button type="button" className={botao.verde} onClick={() => void crm.assumirNegocio(n.id)}>
                Assumir atendimento
              </button>
            )}
          </div>
        )}

        {!podeEditar && n.vendedorId !== null && (
          <p className="rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-700">Somente leitura: este negócio é de outro vendedor.</p>
        )}

        {/* Dados principais */}
        {editando ? (
          <FormEdicao negocioId={n.id} aoTerminar={() => setEditando(false)} />
        ) : (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3.5 text-sm">
            <Info rotulo="Tipo">
              <TipoBadge tipo={n.tipo} />
            </Info>
            <Info rotulo="Valor">
              <strong>{formatarValor(n.valor)}</strong>
            </Info>
            {n.kwp != null && <Info rotulo="Potência">{n.kwp} kWp</Info>}
            <Info rotulo="Etapa">{NOME_ETAPA[n.etapa]}</Info>
            <Info rotulo="Vendedor">
              {admin ? (
                <select
                  aria-label="Vendedor responsável"
                  className={`${campo} py-1.5`}
                  value={n.vendedorId ?? ''}
                  onChange={(e) => void crm.atualizarNegocio(n.id, { vendedorId: e.target.value || null })}
                >
                  <option value="">Sem vendedor</option>
                  {vendedores.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nome}
                    </option>
                  ))}
                </select>
              ) : (
                (n.vendedor?.nome ?? 'Sem vendedor')
              )}
            </Info>
            <Info rotulo="Origem do lead">{NOME_ORIGEM[n.origem]}</Info>
            <Info rotulo="Cidade">{n.cliente?.cidade || '—'}</Info>
            <Info rotulo="Telefone">{n.cliente?.telefone}</Info>
            <Info rotulo="Entrada">{formatarDia(n.criadoEm)}</Info>
          </dl>
        )}

        <div className="flex flex-wrap gap-2">
          {n.cliente && (
            <a href={linkWhatsApp(n.cliente.telefone)} target="_blank" rel="noreferrer" className={botao.principal}>
              <Icone nome="whatsapp" />
              WhatsApp
            </a>
          )}
          {n.cliente && (
            <a href={`tel:${n.cliente.telefone.replace(/\D/g, '')}`} className={botao.neutro}>
              <Icone nome="telefone" />
              Ligar
            </a>
          )}
          {podeEditar && !editando && (
            <button type="button" className={botao.neutro} onClick={() => setEditando(true)}>
              Editar dados
            </button>
          )}
        </div>

        {/* Etapas */}
        <Secao titulo="Mover para a etapa">
          <div className="grid grid-cols-2 gap-2">
            {ETAPAS_FUNIL.map((e) => {
              const atual = n.etapa === e.id;
              return (
                <button
                  key={e.id}
                  type="button"
                  disabled={!podeEditar}
                  aria-pressed={atual}
                  onClick={() => void crm.moverNegocio(n.id, e.id)}
                  className={`min-h-10 rounded-md border px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                    atual
                      ? 'border-suntech-green bg-suntech-green font-semibold text-white'
                      : 'border-gray-300 bg-white text-gray-800 hover:border-suntech-yellow'
                  }`}
                >
                  {e.nome}
                </button>
              );
            })}
            {n.etapa === 'perdido' ? (
              <button type="button" disabled={!podeEditar} className={`${botao.neutro} justify-start`} onClick={() => void crm.moverNegocio(n.id, 'novo')}>
                Reabrir negócio
              </button>
            ) : (
              <button
                type="button"
                disabled={!podeEditar}
                className="min-h-10 rounded-md border border-red-200 bg-white px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => void crm.moverNegocio(n.id, 'perdido')}
              >
                Marcar como perdido
              </button>
            )}
          </div>
        </Secao>

        {/* Tarefas */}
        <Secao titulo="Tarefas">
          <div className="mb-3 flex items-center gap-2 text-sm text-gray-700">
            <StatusBolinha status={n.status} />
            {DESCRICAO_STATUS[n.status]}
          </div>
          <ul className="flex flex-col gap-2">
            {pendentes.map((t) => {
              const atrasada = new Date(t.dataHora) < new Date();
              return (
                <li key={t.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
                  <div className="text-sm">
                    <p className="font-medium text-gray-800">
                      {NOME_TIPO_TAREFA[t.tipo]} · {t.descricao}
                    </p>
                    <p className={`text-xs ${atrasada ? 'font-semibold text-amber-800' : 'text-gray-600'}`}>
                      {formatarDataHora(t.dataHora)}
                      {atrasada && ' · atrasada'}
                    </p>
                  </div>
                  {podeEditar && (
                    <button type="button" className={botao.neutro} onClick={() => void crm.concluirTarefa(t.id)}>
                      <Icone nome="check" />
                      Concluir
                    </button>
                  )}
                </li>
              );
            })}
            {pendentes.length === 0 && <li className="text-sm text-gray-500">Nenhuma tarefa pendente.</li>}
          </ul>
          {podeEditar && <FormTarefa negocioId={n.id} />}
        </Secao>

        {/* Registro de contato */}
        {podeEditar && (
          <Secao titulo="Registrar contato">
            <FormRegistro negocioId={n.id} />
          </Secao>
        )}

        {/* Histórico */}
        <Secao titulo="Histórico">
          <ol className="flex flex-col gap-3">
            {historico.map((h) => (
              <li key={h.id} className="flex gap-3 text-sm">
                <span
                  className={`mt-1.5 size-2 shrink-0 rounded-full ${h.tipo === 'etapa' ? 'bg-suntech-yellow' : 'bg-suntech-green'}`}
                  aria-hidden="true"
                />
                <div>
                  <p className="text-gray-800">{h.texto}</p>
                  <p className="text-xs text-gray-500">
                    {formatarDataHora(h.criadoEm)} · {crm.usuarioPorId(h.usuarioId)?.nome ?? 'Sistema'}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Secao>
      </div>
    </>
  );
}

function Info({ rotulo: r, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs text-gray-600">{r}</dt>
      <dd className="text-gray-800">{children}</dd>
    </div>
  );
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-gray-600">{titulo}</h3>
      {children}
    </section>
  );
}

function FormEdicao({ negocioId, aoTerminar }: { negocioId: string; aoTerminar: () => void }) {
  const crm = useCrm();
  const n = crm.dados.negocios.find((x) => x.id === negocioId)!;
  const [titulo, setTitulo] = useState(n.titulo);
  const [tipo, setTipo] = useState<TipoNegocio>(n.tipo);
  const [valor, setValor] = useState(n.valor == null ? '' : String(n.valor));
  const [kwp, setKwp] = useState(n.kwp == null ? '' : String(n.kwp));

  async function salvar(e: FormEvent) {
    e.preventDefault();
    const ok = await crm.atualizarNegocio(negocioId, {
      titulo: titulo.trim() || n.titulo,
      tipo,
      valor: lerValor(valor),
      kwp: tipo === 'orcamento' ? lerValor(kwp) : null,
    });
    if (ok) aoTerminar();
  }

  return (
    <form onSubmit={salvar} className="grid grid-cols-2 gap-3 rounded-lg border border-gray-200 p-4">
      <label className="col-span-2">
        <span className={rotulo}>Descrição</span>
        <input className={campo} value={titulo} onChange={(e) => setTitulo(e.target.value)} />
      </label>
      <label>
        <span className={rotulo}>Tipo</span>
        <select className={campo} value={tipo} onChange={(e) => setTipo(e.target.value as TipoNegocio)}>
          {Object.entries(TIPOS_NEGOCIO).map(([id, t]) => (
            <option key={id} value={id}>
              {t.nome}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className={rotulo}>Valor (R$)</span>
        <input className={campo} inputMode="decimal" placeholder="Indefinido" value={valor} onChange={(e) => setValor(e.target.value)} />
      </label>
      {tipo === 'orcamento' && (
        <label>
          <span className={rotulo}>Potência (kWp)</span>
          <input className={campo} inputMode="decimal" value={kwp} onChange={(e) => setKwp(e.target.value)} />
        </label>
      )}
      <div className="col-span-2 flex gap-2">
        <button type="submit" className={botao.verde}>
          Salvar
        </button>
        <button type="button" className={botao.neutro} onClick={aoTerminar}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

function FormTarefa({ negocioId }: { negocioId: string }) {
  const { criarTarefa } = useCrm();
  const amanha = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const [tipo, setTipo] = useState<TipoTarefa>('ligacao');
  const [descricao, setDescricao] = useState('');
  const [data, setData] = useState(amanha.toLocaleDateString('sv-SE')); // AAAA-MM-DD
  const [hora, setHora] = useState('09:00');

  async function salvar(e: FormEvent) {
    e.preventDefault();
    const dataHora = new Date(`${data}T${hora}`).toISOString();
    if (await criarTarefa(negocioId, { tipo, descricao, dataHora })) setDescricao('');
  }

  return (
    <form onSubmit={salvar} className="mt-3 grid grid-cols-2 gap-2.5 rounded-lg border border-dashed border-gray-300 p-3">
      <label>
        <span className={rotulo}>Nova tarefa</span>
        <select className={campo} value={tipo} onChange={(e) => setTipo(e.target.value as TipoTarefa)}>
          <option value="ligacao">Ligar</option>
          <option value="visita">Visita</option>
          <option value="tarefa">Tarefa</option>
        </select>
      </label>
      <label>
        <span className={rotulo}>Descrição</span>
        <input className={campo} required value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex.: confirmar visita" />
      </label>
      <label>
        <span className={rotulo}>Data</span>
        <input className={campo} type="date" required value={data} onChange={(e) => setData(e.target.value)} />
      </label>
      <label>
        <span className={rotulo}>Hora</span>
        <input className={campo} type="time" required value={hora} onChange={(e) => setHora(e.target.value)} />
      </label>
      <button type="submit" className={`${botao.verde} col-span-2`}>
        <Icone nome="mais" />
        Agendar tarefa
      </button>
    </form>
  );
}

function FormRegistro({ negocioId }: { negocioId: string }) {
  const { registrarInteracao } = useCrm();
  const [tipo, setTipo] = useState<'nota' | 'ligacao'>('ligacao');
  const [texto, setTexto] = useState('');

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (await registrarInteracao(negocioId, tipo, tipo === 'ligacao' ? `Ligação: ${texto}` : texto)) setTexto('');
  }

  return (
    <form onSubmit={salvar} className="flex flex-col gap-2.5">
      <div className="flex gap-2" role="group" aria-label="Tipo de registro">
        {(['ligacao', 'nota'] as const).map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={tipo === t}
            onClick={() => setTipo(t)}
            className={`rounded-full border px-3.5 py-1.5 text-sm ${
              tipo === t ? 'border-suntech-green bg-suntech-green text-white' : 'border-gray-300 bg-white text-gray-800'
            }`}
          >
            {t === 'ligacao' ? 'Ligação' : 'Anotação'}
          </button>
        ))}
      </div>
      <label>
        <span className="sr-only">O que aconteceu</span>
        <textarea
          className={`${campo} min-h-20`}
          required
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={tipo === 'ligacao' ? 'Ex.: cliente pediu proposta com financiamento' : 'Escreva uma anotação'}
        />
      </label>
      <button type="submit" className={`${botao.neutro} self-start`}>
        Salvar registro
      </button>
    </form>
  );
}
