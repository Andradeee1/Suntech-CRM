/** Ficha do cliente: editar o cadastro, ver os negócios e os anexos. Abre pela tela Clientes e pela ficha do negócio. */
import { useEffect, useState, type FormEvent } from 'react';
import { useUsuarioLogado } from '../contexts/AuthContext';
import { useCrm } from '../contexts/CrmContext';
import { NOME_ETAPA, NOME_ORIGEM } from '../lib/constantes';
import { formatarDia, formatarValor, linkWhatsApp } from '../lib/formatacao';
import { podeEditarCliente } from '../lib/regras';
import type { Cliente } from '../types';
import { PainelAnexos } from './Anexos';
import { botao, campo, rotulo } from './Botoes';
import { TipoBadge } from './Etiquetas';
import { Icone } from './Icone';

export function FichaCliente() {
  const { clienteAbertoId, fecharCliente, clientePorId } = useCrm();
  const cliente = clienteAbertoId ? clientePorId(clienteAbertoId) : undefined;

  useEffect(() => {
    if (!clienteAbertoId) return;
    const aoTeclar = (e: KeyboardEvent) => e.key === 'Escape' && fecharCliente();
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [clienteAbertoId, fecharCliente]);

  if (!cliente) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-gray-900/40" onClick={fecharCliente}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Cadastro de ${cliente.nome}`}
        className="flex h-full w-full max-w-[520px] flex-col overflow-y-auto bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Conteudo key={cliente.id} cliente={cliente} />
      </aside>
    </div>
  );
}

function Conteudo({ cliente }: { cliente: Cliente }) {
  const usuario = useUsuarioLogado();
  const crm = useCrm();
  const podeEditar = podeEditarCliente(usuario, cliente.id, crm.dados.negocios);
  const negocios = crm.dados.negocios.filter((n) => n.clienteId === cliente.id);
  const anexos = crm.dados.anexos.filter((a) => a.clienteId === cliente.id);

  const [nome, setNome] = useState(cliente.nome);
  const [telefone, setTelefone] = useState(cliente.telefone);
  const [email, setEmail] = useState(cliente.email ?? '');
  const [cidade, setCidade] = useState(cliente.cidade);
  const [salvando, setSalvando] = useState(false);

  const alterado =
    nome !== cliente.nome || telefone !== cliente.telefone || email !== (cliente.email ?? '') || cidade !== cliente.cidade;

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    await crm.atualizarCliente(cliente.id, { nome, telefone, email: email || null, cidade });
    setSalvando(false);
  }

  return (
    <>
      <div className="flex items-start justify-between gap-3 bg-suntech-green px-6 py-5 text-white">
        <div className="space-y-1.5">
          <p className="text-xs opacity-85">Cadastro do cliente</p>
          <h2 className="text-2xl font-bold">{cliente.nome}</h2>
          <p className="text-sm opacity-90">
            {NOME_ORIGEM[cliente.origem]} · cliente desde {formatarDia(cliente.criadoEm)}
          </p>
        </div>
        <button
          type="button"
          onClick={crm.fecharCliente}
          className="inline-flex size-11 items-center justify-center rounded-md hover:bg-white/10"
          aria-label="Fechar cadastro"
        >
          <Icone nome="fechar" className="size-5" />
        </button>
      </div>

      <div className="flex flex-col gap-7 px-6 py-5">
        {/* Dados */}
        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-600">Dados do cliente</h3>
          {!podeEditar && (
            <p className="mb-3 rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-700">
              Somente leitura: assuma um negócio deste cliente para poder editá-lo.
            </p>
          )}
          <form onSubmit={salvar} className="grid gap-3 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className={rotulo}>Nome *</span>
              <input className={campo} required disabled={!podeEditar} value={nome} onChange={(e) => setNome(e.target.value)} />
            </label>
            <label>
              <span className={rotulo}>Telefone (WhatsApp) *</span>
              <input className={campo} required type="tel" disabled={!podeEditar} value={telefone} onChange={(e) => setTelefone(e.target.value)} />
            </label>
            <label>
              <span className={rotulo}>Cidade</span>
              <input className={campo} disabled={!podeEditar} value={cidade} onChange={(e) => setCidade(e.target.value)} />
            </label>
            <label className="sm:col-span-2">
              <span className={rotulo}>E-mail</span>
              <input className={campo} type="email" disabled={!podeEditar} value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              {podeEditar && (
                <button type="submit" className={botao.principal} disabled={!alterado || salvando}>
                  {salvando ? 'Salvando…' : 'Salvar alterações'}
                </button>
              )}
              <a href={linkWhatsApp(cliente.telefone)} target="_blank" rel="noreferrer" className={botao.neutro}>
                <Icone nome="whatsapp" />
                WhatsApp
              </a>
            </div>
          </form>
        </section>

        {/* Negócios */}
        <section>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-600">Negócios ({negocios.length})</h3>
            <button type="button" className={botao.neutro} onClick={() => {
                crm.fecharCliente();
                crm.abrirNovoNegocio(cliente.id);
              }}>
              <Icone nome="mais" />
              Novo negócio
            </button>
          </div>
          <ul className="flex flex-col gap-2">
            {negocios.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => {
                    crm.fecharCliente();
                    crm.abrirNegocio(n.id);
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2.5 text-left hover:border-suntech-yellow"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-gray-800">{n.titulo}</span>
                    <span className="text-xs text-gray-600">
                      {NOME_ETAPA[n.etapa]} · {formatarValor(n.valor)}
                    </span>
                  </span>
                  <TipoBadge tipo={n.tipo} />
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* Anexos */}
        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-600">Anexos ({anexos.length})</h3>
          <PainelAnexos clienteId={cliente.id} negocioId={null} anexos={anexos} podeEditar={podeEditar} />
        </section>
      </div>
    </>
  );
}
