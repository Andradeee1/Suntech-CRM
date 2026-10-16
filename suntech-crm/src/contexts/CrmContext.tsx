/**
 * Estado compartilhado do CRM: os dados que o usuário pode ver, a ficha aberta,
 * os avisos (toasts) e as ações. Cada ação chama a camada de dados (services/api)
 * e depois recarrega os dados.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as api from '../services/api';
import { useUsuarioLogado } from './AuthContext';
import type { Cliente, DadosCrm, Etapa, Negocio, NovoNegocioInput, Perfil, TipoTarefa, Usuario } from '../types';
import { NOME_ETAPA } from '../lib/constantes';

interface Aviso {
  id: number;
  texto: string;
  erro: boolean;
}

interface CrmValor {
  dados: DadosCrm;
  carregando: boolean;
  clientePorId: (id: string) => Cliente | undefined;
  usuarioPorId: (id: string | null) => Usuario | undefined;

  negocioAbertoId: string | null;
  abrirNegocio: (id: string) => void;
  fecharNegocio: () => void;

  novoNegocioAberto: { clienteId?: string } | null;
  abrirNovoNegocio: (clienteId?: string) => void;
  fecharNovoNegocio: () => void;

  avisos: Aviso[];
  avisar: (texto: string, erro?: boolean) => void;

  criarNegocio: (dados: NovoNegocioInput) => Promise<Negocio | null>;
  moverNegocio: (negocioId: string, etapa: Etapa) => Promise<void>;
  atualizarNegocio: (
    negocioId: string,
    mudancas: Partial<Pick<Negocio, 'titulo' | 'tipo' | 'valor' | 'kwp' | 'vendedorId'>>,
  ) => Promise<boolean>;
  assumirNegocio: (negocioId: string) => Promise<void>;
  criarTarefa: (negocioId: string, dados: { tipo: TipoTarefa; descricao: string; dataHora: string }) => Promise<boolean>;
  concluirTarefa: (tarefaId: string) => Promise<void>;
  registrarInteracao: (negocioId: string, tipo: 'nota' | 'ligacao', texto: string) => Promise<boolean>;
  criarUsuario: (dados: { nome: string; email: string; perfil: Perfil }) => Promise<boolean>;
  alternarUsuarioAtivo: (usuarioId: string) => Promise<void>;
  simularLeadDoSite: () => Promise<void>;
  restaurarDados: () => Promise<void>;
}

const VAZIO: DadosCrm = { usuarios: [], clientes: [], negocios: [], tarefas: [], interacoes: [] };

const CrmContext = createContext<CrmValor | null>(null);

export function CrmProvider({ children }: { children: ReactNode }) {
  const usuario = useUsuarioLogado();
  const [dados, setDados] = useState<DadosCrm>(VAZIO);
  const [carregando, setCarregando] = useState(true);
  const [negocioAbertoId, setNegocioAbertoId] = useState<string | null>(null);
  const [novoNegocioAberto, setNovoNegocioAberto] = useState<{ clienteId?: string } | null>(null);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const proximoAviso = useRef(1);

  const recarregar = useCallback(async () => {
    setDados(await api.carregarDados(usuario.id));
    setCarregando(false);
  }, [usuario.id]);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  const avisar = useCallback((texto: string, erro = false) => {
    const id = proximoAviso.current++;
    setAvisos((lista) => [...lista, { id, texto, erro }]);
    setTimeout(() => setAvisos((lista) => lista.filter((a) => a.id !== id)), 3500);
  }, []);

  /** Executa uma ação, recarrega os dados e mostra o erro (se houver) num aviso. */
  const executar = useCallback(
    async <T,>(acao: () => Promise<T>, sucesso?: string): Promise<T | null> => {
      try {
        const resultado = await acao();
        await recarregar();
        if (sucesso) avisar(sucesso);
        return resultado;
      } catch (e) {
        avisar(e instanceof Error ? e.message : 'Algo deu errado.', true);
        return null;
      }
    },
    [recarregar, avisar],
  );

  const valor = useMemo<CrmValor>(() => {
    const clientes = new Map(dados.clientes.map((c) => [c.id, c]));
    const usuarios = new Map(dados.usuarios.map((u) => [u.id, u]));
    const nomeCliente = (negocioId: string) => {
      const n = dados.negocios.find((x) => x.id === negocioId);
      return n ? clientes.get(n.clienteId)?.nome ?? 'Cliente' : 'Cliente';
    };

    return {
      dados,
      carregando,
      clientePorId: (id) => clientes.get(id),
      usuarioPorId: (id) => (id ? usuarios.get(id) : undefined),

      negocioAbertoId,
      abrirNegocio: setNegocioAbertoId,
      fecharNegocio: () => setNegocioAbertoId(null),

      novoNegocioAberto,
      abrirNovoNegocio: (clienteId) => setNovoNegocioAberto({ clienteId }),
      fecharNovoNegocio: () => setNovoNegocioAberto(null),

      avisos,
      avisar,

      criarNegocio: (d) => executar(() => api.criarNegocio(usuario.id, d), 'Negócio cadastrado.'),
      moverNegocio: async (id, etapa) => {
        await executar(() => api.moverNegocio(usuario.id, id, etapa), `${nomeCliente(id)} → ${NOME_ETAPA[etapa]}`);
      },
      atualizarNegocio: async (id, mudancas) =>
        (await executar(() => api.atualizarNegocio(usuario.id, id, mudancas), 'Alterações salvas.')) !== null,
      assumirNegocio: async (id) => {
        await executar(() => api.assumirNegocio(usuario.id, id), 'Agora este atendimento é seu.');
      },
      criarTarefa: async (id, d) => (await executar(() => api.criarTarefa(usuario.id, id, d), 'Tarefa agendada.')) !== null,
      concluirTarefa: async (id) => {
        await executar(() => api.concluirTarefa(usuario.id, id), 'Tarefa concluída.');
      },
      registrarInteracao: async (id, tipo, texto) =>
        (await executar(() => api.registrarInteracao(usuario.id, id, tipo, texto), 'Registro adicionado.')) !== null,
      criarUsuario: async (d) => (await executar(() => api.criarUsuario(usuario.id, d), 'Usuário cadastrado.')) !== null,
      alternarUsuarioAtivo: async (id) => {
        await executar(() => api.alternarUsuarioAtivo(usuario.id, id), 'Usuário atualizado.');
      },
      simularLeadDoSite: async () => {
        const exemplos = [
          { nome: 'Beatriz Nunes', tipo: 'orcamento' as const, mensagem: 'Gostaria de um orçamento para minha casa.', consumoMensalKwh: 380 },
          { nome: 'Oficina do Zé', tipo: 'limpeza' as const, mensagem: 'Preciso limpar as placas do telhado.' },
          { nome: 'Cláudio Ramos', tipo: 'atendimento' as const, mensagem: 'O app de monitoramento parou de mostrar a geração.' },
        ];
        const e = exemplos[Math.floor(Math.random() * exemplos.length)]!;
        const sufixo = String(Math.floor(Math.random() * 9000) + 1000);
        await executar(
          () =>
            api.registrarLeadDoSite({
              ...e,
              telefone: `(69) 98000-${sufixo}`,
              cidade: 'Ji-Paraná',
              origem: e.tipo === 'orcamento' ? 'chatbot_simulacao' : 'formulario',
            }),
          `Novo lead do site: ${e.nome}`,
        );
      },
      restaurarDados: async () => {
        await executar(() => api.restaurarDadosDeExemplo(), 'Dados de exemplo restaurados.');
      },
    };
  }, [dados, carregando, negocioAbertoId, novoNegocioAberto, avisos, avisar, executar, usuario.id]);

  return <CrmContext.Provider value={valor}>{children}</CrmContext.Provider>;
}

export function useCrm(): CrmValor {
  const ctx = useContext(CrmContext);
  if (!ctx) throw new Error('useCrm precisa estar dentro de <CrmProvider>');
  return ctx;
}
