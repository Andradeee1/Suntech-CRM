import type { ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth, useUsuarioLogado } from '../contexts/AuthContext';
import { CrmProvider, useCrm } from '../contexts/CrmContext';
import { Avatar } from './Etiquetas';
import { FichaNegocio } from './FichaNegocio';
import { Icone } from './Icone';
import { Logo } from './Logo';
import { NovoNegocioModal } from './NovoNegocioModal';

export function Layout() {
  return (
    <CrmProvider>
      <div className="flex min-h-screen flex-col">
        <Cabecalho />
        <main className="flex-1">
          <Outlet />
        </main>
        <FichaNegocio />
        <NovoNegocioModal />
        <Avisos />
      </div>
    </CrmProvider>
  );
}

function Cabecalho() {
  const usuario = useUsuarioLogado();
  const { sair } = useAuth();
  const links = [
    { para: '/dashboard', nome: 'Dashboard' },
    { para: '/funil', nome: 'Funil' },
    { para: '/clientes', nome: 'Clientes' },
    ...(usuario.perfil === 'admin' ? [{ para: '/usuarios', nome: 'Usuários' }] : []),
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 sm:px-6">
        <NavLink to="/funil" className="py-3" aria-label="SunTech CRM, ir para o funil">
          <Logo />
        </NavLink>

        <nav aria-label="Menu do CRM" className="order-3 flex w-full gap-6 overflow-x-auto md:order-none md:w-auto">
          {links.map((l) => (
            <NavLink
              key={l.para}
              to={l.para}
              className={({ isActive }) =>
                `whitespace-nowrap border-b-[3px] py-4 text-sm font-medium transition-colors hover:text-suntech-yellow-dark ${
                  isActive ? 'border-suntech-yellow font-semibold text-suntech-green' : 'border-transparent text-gray-800'
                }`
              }
            >
              {l.nome}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3 py-2">
          <div className="hidden text-right leading-tight sm:block">
            <div className="text-sm font-semibold">{usuario.nome}</div>
            <div className="text-xs text-gray-600">{usuario.perfil === 'admin' ? 'Administrador' : 'Vendedor'}</div>
          </div>
          <Avatar nome={usuario.nome} />
          <button
            type="button"
            onClick={() => void sair()}
            className="inline-flex size-10 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 hover:text-suntech-green"
            aria-label="Sair"
            title="Sair"
          >
            <Icone nome="sair" className="size-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

function Avisos() {
  const { avisos } = useCrm();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-2 px-4" role="status" aria-live="polite">
      {avisos.map((a) => (
        <div
          key={a.id}
          className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm text-white shadow-xl ${a.erro ? 'bg-red-700' : 'bg-suntech-green'}`}
        >
          <Icone nome={a.erro ? 'alerta' : 'check'} className={`size-4 ${a.erro ? '' : 'text-suntech-yellow'}`} />
          {a.texto}
        </div>
      ))}
    </div>
  );
}

/** Faixa verde do topo de cada página, no estilo da seção inicial do site. */
export function FaixaPagina({
  titulo,
  destaque,
  subtitulo,
  children,
}: {
  titulo: string;
  destaque?: string;
  subtitulo?: string;
  children?: ReactNode;
}) {
  return (
    <section className="bg-gradient-to-r from-suntech-green to-suntech-green/90 text-white">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-5 px-4 py-7 sm:px-6">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold sm:text-3xl">
            {titulo} {destaque && <span className="text-suntech-yellow">{destaque}</span>}
          </h1>
          {subtitulo && <p className="text-[15px] opacity-90">{subtitulo}</p>}
        </div>
        {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}
      </div>
    </section>
  );
}
