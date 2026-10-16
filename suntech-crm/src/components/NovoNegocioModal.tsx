/** Cadastro de negócio (botão "Adicionar negócio"), com cliente existente ou novo. */
import { useEffect, useState, type FormEvent } from 'react';
import { useUsuarioLogado } from '../contexts/AuthContext';
import { useCrm } from '../contexts/CrmContext';
import { NOME_ORIGEM, TIPOS_NEGOCIO } from '../lib/constantes';
import { lerValor } from '../lib/formatacao';
import type { Origem, TipoNegocio } from '../types';
import { botao, campo, rotulo } from './Botoes';
import { Icone } from './Icone';

export function NovoNegocioModal() {
  const { novoNegocioAberto, fecharNovoNegocio } = useCrm();

  useEffect(() => {
    if (!novoNegocioAberto) return;
    const aoTeclar = (e: KeyboardEvent) => e.key === 'Escape' && fecharNovoNegocio();
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [novoNegocioAberto, fecharNovoNegocio]);

  if (!novoNegocioAberto) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-gray-900/40 p-4 sm:items-center" onClick={fecharNovoNegocio}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-novo-negocio"
        className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Formulario clienteInicial={novoNegocioAberto.clienteId} />
      </div>
    </div>
  );
}

function Formulario({ clienteInicial }: { clienteInicial?: string }) {
  const usuario = useUsuarioLogado();
  const crm = useCrm();
  const admin = usuario.perfil === 'admin';

  const [modoCliente, setModoCliente] = useState<'existente' | 'novo'>(clienteInicial ? 'existente' : 'novo');
  const [clienteId, setClienteId] = useState(clienteInicial ?? '');
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [cidade, setCidade] = useState('');
  const [tipo, setTipo] = useState<TipoNegocio>('orcamento');
  const [titulo, setTitulo] = useState('');
  const [valor, setValor] = useState('');
  const [kwp, setKwp] = useState('');
  const [origem, setOrigem] = useState<Origem>('manual');
  const [vendedorId, setVendedorId] = useState(admin ? '' : usuario.id);
  const [salvando, setSalvando] = useState(false);

  const clientes = [...crm.dados.clientes].sort((a, b) => a.nome.localeCompare(b.nome));

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    const negocio = await crm.criarNegocio({
      clienteId: modoCliente === 'existente' ? clienteId : undefined,
      novoCliente: modoCliente === 'novo' ? { nome, telefone, email, cidade } : undefined,
      tipo,
      titulo: titulo.trim() || TIPOS_NEGOCIO[tipo].nome,
      valor: lerValor(valor),
      kwp: tipo === 'orcamento' ? lerValor(kwp) : null,
      vendedorId: vendedorId || null,
      origem,
    });
    setSalvando(false);
    if (negocio) {
      crm.fecharNovoNegocio();
      crm.abrirNegocio(negocio.id);
    }
  }

  return (
    <form onSubmit={salvar}>
      <div className="flex items-center justify-between bg-suntech-green px-6 py-4 text-white">
        <h2 id="titulo-novo-negocio" className="text-lg font-bold">
          Adicionar <span className="text-suntech-yellow">negócio</span>
        </h2>
        <button type="button" onClick={crm.fecharNovoNegocio} className="inline-flex size-10 items-center justify-center rounded-md hover:bg-white/10" aria-label="Fechar">
          <Icone nome="fechar" className="size-5" />
        </button>
      </div>

      <div className="grid gap-5 px-6 py-5">
        <fieldset className="grid gap-3">
          <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">Cliente</legend>
          <div className="flex gap-2" role="group" aria-label="Cliente novo ou existente">
            {(['novo', 'existente'] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={modoCliente === m}
                onClick={() => setModoCliente(m)}
                className={`rounded-full border px-3.5 py-1.5 text-sm ${
                  modoCliente === m ? 'border-suntech-green bg-suntech-green text-white' : 'border-gray-300 bg-white text-gray-800'
                }`}
              >
                {m === 'novo' ? 'Novo cliente' : 'Cliente cadastrado'}
              </button>
            ))}
          </div>

          {modoCliente === 'existente' ? (
            <label>
              <span className={rotulo}>Selecione o cliente *</span>
              <select className={campo} required value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                <option value="">Escolha…</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} · {c.cidade}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className={rotulo}>Nome *</span>
                <input className={campo} required value={nome} onChange={(e) => setNome(e.target.value)} />
              </label>
              <label>
                <span className={rotulo}>Telefone (WhatsApp) *</span>
                <input className={campo} required type="tel" placeholder="(69) 99999-9999" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
              </label>
              <label>
                <span className={rotulo}>Cidade</span>
                <input className={campo} value={cidade} onChange={(e) => setCidade(e.target.value)} />
              </label>
              <label className="sm:col-span-2">
                <span className={rotulo}>E-mail</span>
                <input className={campo} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
            </div>
          )}
        </fieldset>

        <fieldset className="grid gap-3 sm:grid-cols-2">
          <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">Negócio</legend>
          <label>
            <span className={rotulo}>Tipo *</span>
            <select className={campo} value={tipo} onChange={(e) => setTipo(e.target.value as TipoNegocio)}>
              {Object.entries(TIPOS_NEGOCIO).map(([id, t]) => (
                <option key={id} value={id}>
                  {t.nome}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className={rotulo}>Origem</span>
            <select className={campo} value={origem} onChange={(e) => setOrigem(e.target.value as Origem)}>
              {Object.entries(NOME_ORIGEM).map(([id, nomeOrigem]) => (
                <option key={id} value={id}>
                  {nomeOrigem}
                </option>
              ))}
            </select>
          </label>
          <label className="sm:col-span-2">
            <span className={rotulo}>Descrição</span>
            <input
              className={campo}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder={tipo === 'orcamento' ? 'Ex.: Residencial · 6 kWp' : tipo === 'limpeza' ? 'Ex.: Limpeza de 12 painéis' : 'Ex.: Inversor com alerta'}
            />
          </label>
          <label>
            <span className={rotulo}>Valor (R$)</span>
            <input className={campo} inputMode="decimal" placeholder="Deixe vazio se indefinido" value={valor} onChange={(e) => setValor(e.target.value)} />
          </label>
          {tipo === 'orcamento' && (
            <label>
              <span className={rotulo}>Potência (kWp)</span>
              <input className={campo} inputMode="decimal" value={kwp} onChange={(e) => setKwp(e.target.value)} />
            </label>
          )}
          {admin && (
            <label className="sm:col-span-2">
              <span className={rotulo}>Vendedor responsável</span>
              <select className={campo} value={vendedorId} onChange={(e) => setVendedorId(e.target.value)}>
                <option value="">Sem vendedor (fica disponível para assumir)</option>
                {crm.dados.usuarios
                  .filter((u) => u.ativo)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nome}
                    </option>
                  ))}
              </select>
            </label>
          )}
        </fieldset>
      </div>

      <div className="flex justify-end gap-2 border-t border-gray-200 bg-gray-50 px-6 py-4">
        <button type="button" className={botao.neutro} onClick={crm.fecharNovoNegocio}>
          Cancelar
        </button>
        <button type="submit" className={botao.principal} disabled={salvando}>
          {salvando ? 'Salvando…' : 'Adicionar negócio'}
        </button>
      </div>
    </form>
  );
}
