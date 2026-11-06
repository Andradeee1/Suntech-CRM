import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as api from '../services/api';
import type { Usuario } from '../types';

interface AuthValor {
  usuario: Usuario | null;
  carregando: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  sair: () => Promise<void>;
}

const AuthContext = createContext<AuthValor | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  // Ao abrir o sistema, recupera a sessão salva.
  useEffect(() => {
    api
      .usuarioDaSessao()
      .then(setUsuario)
      .finally(() => setCarregando(false));
  }, []);

  const entrar = useCallback(async (email: string, senha: string) => {
    setUsuario(await api.entrar(email, senha));
  }, []);

  const sair = useCallback(async () => {
    await api.sair();
    setUsuario(null);
  }, []);

  const valor = useMemo(() => ({ usuario, carregando, entrar, sair }), [usuario, carregando, entrar, sair]);
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValor {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return ctx;
}

/** Atalho para telas que só aparecem com alguém logado. */
export function useUsuarioLogado(): Usuario {
  const { usuario } = useAuth();
  if (!usuario) throw new Error('Nenhum usuário logado');
  return usuario;
}
