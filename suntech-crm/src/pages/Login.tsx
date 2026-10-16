import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { botao, campo, rotulo } from '../components/Botoes';
import { Icone } from '../components/Icone';
import { Logo } from '../components/Logo';
import { SENHA_DEMO } from '../data/seed';

const CONTAS_DEMO = [
  { email: 'admin@suntech.com.br', nome: 'Roberto Lima', perfil: 'Administrador' },
  { email: 'marina@suntech.com.br', nome: 'Marina Costa', perfil: 'Vendedora' },
  { email: 'carlos@suntech.com.br', nome: 'Carlos Souza', perfil: 'Vendedor' },
];

export function Login() {
  const { usuario, entrar } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to="/funil" replace />;

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      await entrar(email, senha);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível entrar.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center px-4">
          <Logo />
        </div>
      </header>

      <main className="flex flex-1 flex-col lg:flex-row">
        <section className="flex items-center bg-gradient-to-r from-suntech-green to-suntech-green/90 px-6 py-12 text-white lg:w-1/2 lg:px-16">
          <div className="max-w-md space-y-4">
            <h1 className="text-4xl font-bold leading-tight">
              Área do <span className="text-suntech-yellow">colaborador</span>
            </h1>
            <p className="text-lg opacity-90">
              Acompanhe os leads do site, organize os atendimentos e nunca perca um retorno para o cliente.
            </p>
          </div>
        </section>

        <section className="flex flex-1 items-center justify-center px-4 py-12">
          <form onSubmit={enviar} className="w-full max-w-sm space-y-4 rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
            <h2 className="text-xl font-bold">Entrar</h2>
            <label className="block">
              <span className={rotulo}>E-mail</span>
              <input className={campo} type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="block">
              <span className={rotulo}>Senha</span>
              <input className={campo} type="password" autoComplete="current-password" required value={senha} onChange={(e) => setSenha(e.target.value)} />
            </label>
            {erro && (
              <p role="alert" className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
                <Icone nome="alerta" />
                {erro}
              </p>
            )}
            <button type="submit" className={`${botao.principal} w-full`} disabled={enviando}>
              {enviando ? 'Entrando…' : 'Entrar'}
            </button>

            <div className="space-y-2 border-t border-gray-200 pt-4">
              <p className="text-xs text-gray-600">
                Contas de demonstração (senha <code className="rounded bg-gray-100 px-1">{SENHA_DEMO}</code>):
              </p>
              {CONTAS_DEMO.map((c) => (
                <button
                  key={c.email}
                  type="button"
                  className="flex w-full items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-left text-sm hover:border-suntech-yellow"
                  onClick={() => {
                    setEmail(c.email);
                    setSenha(SENHA_DEMO);
                  }}
                >
                  <span className="font-medium">{c.nome}</span>
                  <span className="text-xs text-gray-600">{c.perfil}</span>
                </button>
              ))}
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
