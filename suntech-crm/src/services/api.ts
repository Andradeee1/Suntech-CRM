/**
 * CAMADA DE DADOS DO CRM
 * ======================
 * Por enquanto, o "banco" fica no localStorage do navegador, com dados fictícios.
 * Todas as telas falam SOMENTE com as funções exportadas daqui.
 *
 * Quando o Supabase entrar, só este arquivo muda: cada função passa a chamar
 * o supabase-js (ex.: supabase.from('negocios').update(...)) mantendo os mesmos
 * nomes, parâmetros e retornos. As telas não precisam ser alteradas.
 *
 * As verificações de permissão abaixo imitam as políticas RLS que serão criadas
 * no banco: no Supabase, quem garante a segurança é o banco, não a tela.
 */
import { criarDadosIniciais, SENHA_DEMO } from '../data/seed';
import { NOME_ETAPA, NOME_ORIGEM } from '../lib/constantes';
import { podeAssumirNegocio, podeEditarNegocio, podeGerenciar, podeVerNegocio } from '../lib/regras';
import type {
  DadosCrm,
  Etapa,
  Interacao,
  LeadDoSiteInput,
  Negocio,
  NovoNegocioInput,
  Perfil,
  Tarefa,
  TipoInteracao,
  TipoNegocio,
  TipoTarefa,
  Usuario,
} from '../types';

const CHAVE_BANCO = 'suntech-crm:banco:v1';
const CHAVE_SESSAO = 'suntech-crm:sessao';

// ---------------------------------------------------------------------------
// "Banco" local
// ---------------------------------------------------------------------------

let memoria: DadosCrm | null = null;

function lerBanco(): DadosCrm {
  if (memoria) return memoria;
  try {
    const salvo = localStorage.getItem(CHAVE_BANCO);
    if (salvo) {
      memoria = JSON.parse(salvo) as DadosCrm;
      return memoria;
    }
  } catch {
    // localStorage indisponível ou corrompido: recomeça com os dados de exemplo
  }
  memoria = criarDadosIniciais();
  salvarBanco();
  return memoria;
}

function salvarBanco(): void {
  try {
    localStorage.setItem(CHAVE_BANCO, JSON.stringify(memoria));
  } catch {
    // sem persistência (ex.: aba anônima); os dados ficam só em memória
  }
}

/** Simula a latência de uma chamada de rede, para a interface tratar o "carregando". */
function rede<T>(valor: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(valor)), 120));
}

function novoId(prefixo: string): string {
  return `${prefixo}-${crypto.randomUUID().slice(0, 8)}`;
}

function agoraIso(): string {
  return new Date().toISOString();
}

export class ErroCrm extends Error {}

// ---------------------------------------------------------------------------
// Autenticação (no Supabase: supabase.auth.signInWithPassword / signOut)
// ---------------------------------------------------------------------------

export async function entrar(email: string, senha: string): Promise<Usuario> {
  const banco = lerBanco();
  const usuario = banco.usuarios.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!usuario || senha !== SENHA_DEMO) throw new ErroCrm('E-mail ou senha incorretos.');
  if (!usuario.ativo) throw new ErroCrm('Usuário desativado. Fale com o administrador.');
  try {
    localStorage.setItem(CHAVE_SESSAO, usuario.id);
  } catch {
    /* sessão só em memória */
  }
  return rede(usuario);
}

export async function sair(): Promise<void> {
  try {
    localStorage.removeItem(CHAVE_SESSAO);
  } catch {
    /* nada a fazer */
  }
}

export async function usuarioDaSessao(): Promise<Usuario | null> {
  let id: string | null = null;
  try {
    id = localStorage.getItem(CHAVE_SESSAO);
  } catch {
    return null;
  }
  const usuario = lerBanco().usuarios.find((u) => u.id === id && u.ativo) ?? null;
  return rede(usuario);
}

function exigirUsuario(usuarioId: string): Usuario {
  const usuario = lerBanco().usuarios.find((u) => u.id === usuarioId && u.ativo);
  if (!usuario) throw new ErroCrm('Sessão expirada. Entre novamente.');
  return usuario;
}

function exigirNegocio(negocioId: string): Negocio {
  const negocio = lerBanco().negocios.find((n) => n.id === negocioId);
  if (!negocio) throw new ErroCrm('Negócio não encontrado.');
  return negocio;
}

function registrar(negocioId: string, usuarioId: string | null, tipo: TipoInteracao, texto: string): void {
  lerBanco().interacoes.push({ id: novoId('i'), negocioId, usuarioId, tipo, texto, criadoEm: agoraIso() });
}

// ---------------------------------------------------------------------------
// Leitura (no Supabase: vários select(); o RLS devolve só o que o usuário pode ver)
// ---------------------------------------------------------------------------

export async function carregarDados(usuarioId: string): Promise<DadosCrm> {
  const usuario = exigirUsuario(usuarioId);
  const banco = lerBanco();
  const negocios = banco.negocios.filter((n) => podeVerNegocio(usuario, n));
  const idsNegocios = new Set(negocios.map((n) => n.id));
  const idsClientes = new Set(negocios.map((n) => n.clienteId));
  return rede({
    usuarios: banco.usuarios,
    clientes: usuario.perfil === 'admin' ? banco.clientes : banco.clientes.filter((c) => idsClientes.has(c.id)),
    negocios,
    tarefas: banco.tarefas.filter((t) => idsNegocios.has(t.negocioId)),
    interacoes: banco.interacoes.filter((i) => idsNegocios.has(i.negocioId)),
  });
}

// ---------------------------------------------------------------------------
// Negócios
// ---------------------------------------------------------------------------

export async function criarNegocio(usuarioId: string, dados: NovoNegocioInput): Promise<Negocio> {
  const usuario = exigirUsuario(usuarioId);
  const banco = lerBanco();
  const agora = agoraIso();

  let clienteId = dados.clienteId;
  if (!clienteId) {
    if (!dados.novoCliente) throw new ErroCrm('Informe o cliente.');
    const { nome, telefone, email, cidade } = dados.novoCliente;
    if (!nome.trim() || !telefone.trim()) throw new ErroCrm('Nome e telefone do cliente são obrigatórios.');
    clienteId = novoId('c');
    banco.clientes.push({
      id: clienteId,
      nome: nome.trim(),
      telefone: telefone.trim(),
      email: email?.trim() || null,
      cidade: cidade.trim(),
      origem: dados.origem,
      criadoEm: agora,
    });
  }

  // Vendedor só pode cadastrar negócio para si mesmo.
  const vendedorId = usuario.perfil === 'admin' ? dados.vendedorId : usuario.id;

  const negocio: Negocio = {
    id: novoId('n'),
    clienteId,
    tipo: dados.tipo,
    titulo: dados.titulo.trim(),
    valor: dados.valor,
    kwp: dados.kwp,
    etapa: 'novo',
    vendedorId,
    origem: dados.origem,
    criadoEm: agora,
    atualizadoEm: agora,
  };
  banco.negocios.push(negocio);
  registrar(negocio.id, usuario.id, 'sistema', `Negócio cadastrado por ${usuario.nome}`);
  salvarBanco();
  return rede(negocio);
}

export async function moverNegocio(usuarioId: string, negocioId: string, etapa: Etapa): Promise<Negocio> {
  const usuario = exigirUsuario(usuarioId);
  const negocio = exigirNegocio(negocioId);
  if (!podeEditarNegocio(usuario, negocio)) {
    throw new ErroCrm(negocio.vendedorId ? 'Este negócio pertence a outro vendedor.' : 'Assuma o negócio antes de movê-lo.');
  }
  if (negocio.etapa === etapa) return rede(negocio);
  const anterior = negocio.etapa;
  negocio.etapa = etapa;
  negocio.atualizadoEm = agoraIso();
  registrar(negocio.id, usuario.id, 'etapa', `Etapa: ${NOME_ETAPA[anterior]} → ${NOME_ETAPA[etapa]}`);
  salvarBanco();
  return rede(negocio);
}

export async function atualizarNegocio(
  usuarioId: string,
  negocioId: string,
  mudancas: Partial<Pick<Negocio, 'titulo' | 'tipo' | 'valor' | 'kwp' | 'vendedorId'>>,
): Promise<Negocio> {
  const usuario = exigirUsuario(usuarioId);
  const negocio = exigirNegocio(negocioId);
  if (!podeEditarNegocio(usuario, negocio)) throw new ErroCrm('Você não pode editar este negócio.');
  if ('vendedorId' in mudancas && mudancas.vendedorId !== negocio.vendedorId) {
    if (!podeGerenciar(usuario)) throw new ErroCrm('Só o administrador troca o vendedor.');
    const novo = lerBanco().usuarios.find((u) => u.id === mudancas.vendedorId);
    registrar(negocio.id, usuario.id, 'sistema', novo ? `Atribuído a ${novo.nome}` : 'Vendedor removido');
  }
  Object.assign(negocio, mudancas, { atualizadoEm: agoraIso() });
  salvarBanco();
  return rede(negocio);
}

export async function assumirNegocio(usuarioId: string, negocioId: string): Promise<Negocio> {
  const usuario = exigirUsuario(usuarioId);
  const negocio = exigirNegocio(negocioId);
  if (!podeAssumirNegocio(usuario, negocio)) throw new ErroCrm('Este negócio já tem vendedor.');
  negocio.vendedorId = usuario.id;
  negocio.atualizadoEm = agoraIso();
  registrar(negocio.id, usuario.id, 'sistema', `${usuario.nome} assumiu o atendimento`);
  salvarBanco();
  return rede(negocio);
}

// ---------------------------------------------------------------------------
// Tarefas e histórico
// ---------------------------------------------------------------------------

export async function criarTarefa(
  usuarioId: string,
  negocioId: string,
  dados: { tipo: TipoTarefa; descricao: string; dataHora: string },
): Promise<Tarefa> {
  const usuario = exigirUsuario(usuarioId);
  const negocio = exigirNegocio(negocioId);
  if (!podeEditarNegocio(usuario, negocio)) throw new ErroCrm('Você não pode agendar tarefas neste negócio.');
  if (!dados.descricao.trim()) throw new ErroCrm('Descreva a tarefa.');
  const tarefa: Tarefa = {
    id: novoId('t'),
    negocioId,
    tipo: dados.tipo,
    descricao: dados.descricao.trim(),
    dataHora: dados.dataHora,
    concluida: false,
    responsavelId: negocio.vendedorId ?? usuario.id,
  };
  lerBanco().tarefas.push(tarefa);
  salvarBanco();
  return rede(tarefa);
}

export async function concluirTarefa(usuarioId: string, tarefaId: string): Promise<Tarefa> {
  const usuario = exigirUsuario(usuarioId);
  const tarefa = lerBanco().tarefas.find((t) => t.id === tarefaId);
  if (!tarefa) throw new ErroCrm('Tarefa não encontrada.');
  const negocio = exigirNegocio(tarefa.negocioId);
  if (!podeEditarNegocio(usuario, negocio)) throw new ErroCrm('Você não pode alterar esta tarefa.');
  tarefa.concluida = true;
  registrar(negocio.id, usuario.id, 'sistema', `Tarefa concluída: ${tarefa.descricao}`);
  salvarBanco();
  return rede(tarefa);
}

export async function registrarInteracao(
  usuarioId: string,
  negocioId: string,
  tipo: Extract<TipoInteracao, 'nota' | 'ligacao'>,
  texto: string,
): Promise<Interacao> {
  const usuario = exigirUsuario(usuarioId);
  const negocio = exigirNegocio(negocioId);
  if (!podeEditarNegocio(usuario, negocio)) throw new ErroCrm('Você não pode registrar neste negócio.');
  if (!texto.trim()) throw new ErroCrm('Escreva o que aconteceu.');
  const interacao: Interacao = {
    id: novoId('i'),
    negocioId,
    usuarioId: usuario.id,
    tipo,
    texto: texto.trim(),
    criadoEm: agoraIso(),
  };
  lerBanco().interacoes.push(interacao);
  salvarBanco();
  return rede(interacao);
}

// ---------------------------------------------------------------------------
// Usuários (só admin). No Supabase, criar usuário passa pelo Supabase Auth.
// ---------------------------------------------------------------------------

export async function criarUsuario(
  usuarioId: string,
  dados: { nome: string; email: string; perfil: Perfil },
): Promise<Usuario> {
  const admin = exigirUsuario(usuarioId);
  if (!podeGerenciar(admin)) throw new ErroCrm('Apenas administradores cadastram usuários.');
  const banco = lerBanco();
  const email = dados.email.trim().toLowerCase();
  if (!dados.nome.trim() || !/^\S+@\S+\.\S+$/.test(email)) throw new ErroCrm('Informe nome e e-mail válidos.');
  if (banco.usuarios.some((u) => u.email === email)) throw new ErroCrm('Já existe um usuário com este e-mail.');
  const usuario: Usuario = { id: novoId('u'), nome: dados.nome.trim(), email, perfil: dados.perfil, ativo: true };
  banco.usuarios.push(usuario);
  salvarBanco();
  return rede(usuario);
}

export async function alternarUsuarioAtivo(usuarioId: string, alvoId: string): Promise<Usuario> {
  const admin = exigirUsuario(usuarioId);
  if (!podeGerenciar(admin)) throw new ErroCrm('Apenas administradores alteram usuários.');
  if (admin.id === alvoId) throw new ErroCrm('Você não pode desativar a si mesmo.');
  const alvo = lerBanco().usuarios.find((u) => u.id === alvoId);
  if (!alvo) throw new ErroCrm('Usuário não encontrado.');
  alvo.ativo = !alvo.ativo;
  salvarBanco();
  return rede(alvo);
}

// ---------------------------------------------------------------------------
// Captação de leads do site.
// Esta é a função que o formulário (solicita.html) e o chatbot (main.js) vão usar.
// No Supabase, o site poderá apenas INSERIR (nunca ler) — regra garantida pelo RLS.
// ---------------------------------------------------------------------------

export async function registrarLeadDoSite(dados: LeadDoSiteInput): Promise<Negocio> {
  const banco = lerBanco();
  const agora = agoraIso();
  const digitos = dados.telefone.replace(/\D/g, '');

  // Evita duplicar o cliente que preencheu o formulário mais de uma vez.
  let cliente = banco.clientes.find((c) => c.telefone.replace(/\D/g, '') === digitos);
  if (!cliente) {
    cliente = {
      id: novoId('c'),
      nome: dados.nome.trim(),
      telefone: dados.telefone.trim(),
      email: dados.email?.trim() || null,
      cidade: dados.cidade?.trim() || '',
      origem: dados.origem,
      criadoEm: agora,
    };
    banco.clientes.push(cliente);
  }

  const titulos: Record<TipoNegocio, string> = {
    orcamento: dados.consumoMensalKwh ? `Orçamento · consumo ${dados.consumoMensalKwh} kWh/mês` : 'Pedido de orçamento',
    limpeza: 'Pedido de limpeza de placas',
    atendimento: 'Pedido de atendimento',
  };

  const negocio: Negocio = {
    id: novoId('n'),
    clienteId: cliente.id,
    tipo: dados.tipo,
    titulo: titulos[dados.tipo],
    valor: null,
    kwp: null,
    etapa: 'novo',
    vendedorId: null,
    origem: dados.origem,
    criadoEm: agora,
    atualizadoEm: agora,
  };
  banco.negocios.push(negocio);
  registrar(negocio.id, null, 'sistema', `Lead registrado · ${NOME_ORIGEM[dados.origem]}`);
  if (dados.mensagem.trim()) registrar(negocio.id, null, 'nota', `Mensagem do cliente: “${dados.mensagem.trim()}”`);
  salvarBanco();
  return rede(negocio);
}

// ---------------------------------------------------------------------------
// Apoio à demonstração
// ---------------------------------------------------------------------------

/** Volta o "banco" local aos dados de exemplo. */
export async function restaurarDadosDeExemplo(): Promise<void> {
  memoria = criarDadosIniciais();
  salvarBanco();
}
