/**
 * Tipos do domínio do CRM.
 * Cada interface corresponde a uma tabela que será criada no Supabase (PostgreSQL).
 * Os nomes dos campos aqui estão em camelCase; no banco usaremos snake_case
 * (ex.: vendedorId -> vendedor_id).
 */

export type Perfil = 'admin' | 'vendedor';

/** Etapas do quadro de negócios. "perdido" não aparece como coluna, mas existe para relatórios. */
export type Etapa = 'novo' | 'atendimento' | 'agendado' | 'proposta' | 'concluido' | 'perdido';

/** Tipo de demanda do cliente. */
export type TipoNegocio = 'orcamento' | 'limpeza' | 'atendimento';

/** De onde o lead veio. Os três primeiros chegam pelo site (formulário e chatbot). */
export type Origem =
  | 'formulario'
  | 'chatbot_orcamento'
  | 'chatbot_simulacao'
  | 'indicacao'
  | 'base'
  | 'manual';

export type TipoTarefa = 'ligacao' | 'visita' | 'tarefa';

export type TipoInteracao = 'nota' | 'ligacao' | 'etapa' | 'sistema';

/** Situação das tarefas de um negócio (bolinha colorida do card). */
export type StatusTarefa = 'agendada' | 'atrasada' | 'sem';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  ativo: boolean;
}

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email: string | null;
  cidade: string;
  origem: Origem;
  criadoEm: string; // ISO 8601
}

export interface Negocio {
  id: string;
  clienteId: string;
  tipo: TipoNegocio;
  titulo: string; // ex.: "Residencial · 6 kWp" ou "Limpeza de 18 painéis"
  valor: number | null; // null = valor indefinido
  kwp: number | null; // potência do sistema, só para orçamentos
  etapa: Etapa;
  vendedorId: string | null; // null = ainda sem vendedor
  origem: Origem;
  criadoEm: string;
  atualizadoEm: string;
}

export interface Tarefa {
  id: string;
  negocioId: string;
  tipo: TipoTarefa;
  descricao: string;
  dataHora: string; // ISO 8601
  concluida: boolean;
  responsavelId: string | null;
}

export interface Interacao {
  id: string;
  negocioId: string;
  usuarioId: string | null; // null = registrado pelo sistema (ex.: lead do site)
  tipo: TipoInteracao;
  texto: string;
  criadoEm: string;
}

export type CategoriaAnexo = 'fotos' | 'projeto' | 'contrato' | 'outro';

/**
 * Arquivo anexado a um cliente (fotos do imóvel, projeto, contrato...).
 * Aqui ficam só os dados do arquivo; o arquivo em si fica no armazenamento
 * (hoje no navegador, depois no Supabase Storage).
 */
export interface Anexo {
  id: string;
  clienteId: string;
  negocioId: string | null; // null = anexo do cliente, sem negócio específico
  nome: string;
  tipoArquivo: string; // ex.: image/jpeg, application/pdf
  tamanho: number; // em bytes
  categoria: CategoriaAnexo;
  enviadoPor: string;
  criadoEm: string;
}

/** Tudo o que o usuário logado pode ver (o "banco" já filtrado pelas permissões). */
export interface DadosCrm {
  usuarios: Usuario[];
  clientes: Cliente[];
  negocios: Negocio[];
  tarefas: Tarefa[];
  interacoes: Interacao[];
  anexos: Anexo[];
}

/** Dados para cadastrar um negócio. Pode usar um cliente existente ou criar um novo. */
export interface NovoNegocioInput {
  clienteId?: string;
  novoCliente?: { nome: string; telefone: string; email?: string; cidade: string };
  tipo: TipoNegocio;
  titulo: string;
  valor: number | null;
  kwp: number | null;
  vendedorId: string | null;
  origem: Origem;
}

/** Dados que o formulário e o chatbot do site vão enviar. */
export interface LeadDoSiteInput {
  nome: string;
  telefone: string;
  email?: string;
  cidade?: string;
  tipo: TipoNegocio;
  mensagem: string;
  origem: Extract<Origem, 'formulario' | 'chatbot_orcamento' | 'chatbot_simulacao'>;
  consumoMensalKwh?: number;
}
