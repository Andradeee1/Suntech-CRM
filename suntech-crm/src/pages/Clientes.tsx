import { useMemo, useState } from 'react';
import { useCrm } from '../contexts/CrmContext';
import { FaixaPagina } from '../components/Layout';
import { botao, campo } from '../components/Botoes';
import { Icone } from '../components/Icone';
import { NOME_ORIGEM } from '../lib/constantes';
import { formatarDia, formatarMoeda } from '../lib/formatacao';
import { estaAberto } from '../lib/regras';

export function Clientes() {
  const crm = useCrm();
  const [busca, setBusca] = useState('');

  const linhas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return crm.dados.clientes
      .filter((c) => !termo || `${c.nome} ${c.cidade} ${c.telefone}`.toLowerCase().includes(termo))
      .map((c) => {
        const negocios = crm.dados.negocios.filter((n) => n.clienteId === c.id);
        const fechado = negocios.filter((n) => n.etapa === 'concluido').reduce((s, n) => s + (n.valor ?? 0), 0);
        const ultimo = [...negocios].sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm))[0];
        return { cliente: c, negocios, abertos: negocios.filter(estaAberto).length, fechado, ultimo };
      })
      .sort((a, b) => a.cliente.nome.localeCompare(b.cliente.nome));
  }, [crm.dados, busca]);

  return (
    <>
      <FaixaPagina titulo="Carteira de" destaque="clientes" subtitulo="Todos os clientes da empresa e os negócios de cada um.">
        <span className="mr-2 text-sm">
          <strong className="text-2xl">{crm.dados.clientes.length}</strong> clientes
        </span>
        <button type="button" className={botao.principal} onClick={() => crm.abrirNovoNegocio()}>
          <Icone nome="mais" />
          Novo cliente
        </button>
      </FaixaPagina>

      <div className="mx-auto max-w-[1440px] space-y-4 px-4 py-6 sm:px-6">
        <label className="relative flex max-w-sm items-center">
          <span className="sr-only">Buscar cliente</span>
          <Icone nome="busca" className="pointer-events-none absolute left-3 size-4 text-gray-500" />
          <input type="search" className={`${campo} pl-9`} placeholder="Buscar por nome, cidade ou telefone" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </label>

        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-600">
                {['Cliente', 'Telefone', 'Cidade', 'Origem', 'Negócios', 'Valor fechado', 'Última atualização', ''].map((c, i) => (
                  <th key={i} className="px-4 py-3 font-semibold">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhas.map(({ cliente: c, negocios, abertos, fechado, ultimo }) => (
                <tr key={c.id} className="border-t border-gray-100 align-top">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-800">{c.nome}</p>
                    <p className="text-xs text-gray-600">Cliente desde {formatarDia(c.criadoEm)}</p>
                  </td>
                  <td className="px-4 py-3">{c.telefone}</td>
                  <td className="px-4 py-3">{c.cidade || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{NOME_ORIGEM[c.origem]}</td>
                  <td className="px-4 py-3">
                    <ul className="space-y-1">
                      {negocios.map((n) => (
                        <li key={n.id}>
                          <button type="button" className="text-left text-suntech-green hover:underline" onClick={() => crm.abrirNegocio(n.id)}>
                            {n.titulo}
                          </button>
                        </li>
                      ))}
                    </ul>
                    {abertos > 0 && <p className="mt-1 text-xs text-gray-600">{abertos} em aberto</p>}
                  </td>
                  <td className="px-4 py-3 font-semibold">{fechado > 0 ? formatarMoeda(fechado) : '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{ultimo ? formatarDia(ultimo.atualizadoEm) : '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" className={botao.neutro} onClick={() => crm.abrirNovoNegocio(c.id)}>
                      <Icone nome="mais" />
                      Negócio
                    </button>
                  </td>
                </tr>
              ))}
              {linhas.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
