import { useState, type FormEvent } from 'react';
import { useUsuarioLogado } from '../contexts/AuthContext';
import { useCrm } from '../contexts/CrmContext';
import { FaixaPagina } from '../components/Layout';
import { botao, campo, rotulo } from '../components/Botoes';
import { Avatar } from '../components/Etiquetas';
import { Icone } from '../components/Icone';
import { estaAberto } from '../lib/regras';
import type { Perfil } from '../types';

export function Usuarios() {
  const eu = useUsuarioLogado();
  const crm = useCrm();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [perfil, setPerfil] = useState<Perfil>('vendedor');

  async function cadastrar(e: FormEvent) {
    e.preventDefault();
    if (await crm.criarUsuario({ nome, email, perfil })) {
      setNome('');
      setEmail('');
      setPerfil('vendedor');
    }
  }

  return (
    <>
      <FaixaPagina titulo="Equipe e" destaque="acessos" subtitulo="Administradores veem tudo. Vendedores veem os próprios negócios e os leads sem dono." />

      <div className="mx-auto grid max-w-[1440px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_360px]">
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-600">
                {['Usuário', 'Perfil', 'Negócios em aberto', 'Situação', ''].map((c, i) => (
                  <th key={i} className="px-4 py-3 font-semibold">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {crm.dados.usuarios.map((u) => (
                <tr key={u.id} className="border-t border-gray-100">
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-3">
                      <Avatar nome={u.nome} />
                      <span>
                        <span className="block font-semibold">{u.nome}</span>
                        <span className="text-xs text-gray-600">{u.email}</span>
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3">{u.perfil === 'admin' ? 'Administrador' : 'Vendedor'}</td>
                  <td className="px-4 py-3">{crm.dados.negocios.filter((n) => n.vendedorId === u.id && estaAberto(n)).length}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${u.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>
                      {u.ativo ? 'Ativo' : 'Desativado'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.id !== eu.id && (
                      <button type="button" className={botao.neutro} onClick={() => void crm.alternarUsuarioAtivo(u.id)}>
                        {u.ativo ? 'Desativar' : 'Reativar'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form onSubmit={cadastrar} className="flex h-fit flex-col gap-3.5 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold">Novo usuário</h2>
          <label>
            <span className={rotulo}>Nome *</span>
            <input className={campo} required value={nome} onChange={(e) => setNome(e.target.value)} />
          </label>
          <label>
            <span className={rotulo}>E-mail *</span>
            <input className={campo} required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            <span className={rotulo}>Perfil</span>
            <select className={campo} value={perfil} onChange={(e) => setPerfil(e.target.value as Perfil)}>
              <option value="vendedor">Vendedor</option>
              <option value="admin">Administrador</option>
            </select>
          </label>
          <p className="text-xs text-gray-600">Nesta versão de demonstração, a senha de todos é a mesma da tela de login.</p>
          <button type="submit" className={botao.principal}>
            <Icone nome="mais" />
            Cadastrar usuário
          </button>
          <hr className="border-gray-200" />
          <button type="button" className={botao.neutro} onClick={() => void crm.restaurarDados()}>
            <Icone nome="recarregar" />
            Restaurar dados de exemplo
          </button>
        </form>
      </div>
    </>
  );
}
