import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Clientes } from './pages/Clientes';
import { Dashboard } from './pages/Dashboard';
import { QuadroNegocios } from './pages/QuadroNegocios';
import { Login } from './pages/Login';
import { Usuarios } from './pages/Usuarios';

/** Bloqueia as telas internas para quem não está logado (e Usuários para quem não é admin). */
function Protegida({ children, somenteAdmin = false }: { children: ReactNode; somenteAdmin?: boolean }) {
  const { usuario, carregando } = useAuth();
  if (carregando) return <p className="p-10 text-center text-gray-600">Carregando…</p>;
  if (!usuario) return <Navigate to="/login" replace />;
  if (somenteAdmin && usuario.perfil !== 'admin') return <Navigate to="/negocios" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <Protegida>
                <Layout />
              </Protegida>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/negocios" element={<QuadroNegocios />} />
            {/* endereço antigo, mantido para quem tiver salvo o link */}
            <Route path="/funil" element={<Navigate to="/negocios" replace />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route
              path="/usuarios"
              element={
                <Protegida somenteAdmin>
                  <Usuarios />
                </Protegida>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/negocios" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
