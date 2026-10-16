/**
 * Dados FICTÍCIOS para demonstração (LGPD: nenhum dado real de cliente).
 * As datas são calculadas a partir de "agora", então as tarefas sempre parecem atuais.
 * Quando o Supabase entrar, este arquivo vira o script de "seed" do banco.
 */
import type { Cliente, DadosCrm, Etapa, Interacao, Negocio, Origem, Tarefa, TipoNegocio, TipoTarefa, Usuario } from '../types';
import { NOME_ORIGEM } from '../lib/constantes';

/** Senha das contas de demonstração (no Supabase, o login fica com o Supabase Auth). */
export const SENHA_DEMO = 'suntech123';

export function criarDadosIniciais(agora: Date = new Date()): DadosCrm {
  /** Data relativa a hoje: em(-2, 9) = anteontem às 09:00. */
  const em = (dias: number, hora = 9, minuto = 0): string => {
    const d = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + dias, hora, minuto);
    return d.toISOString();
  };

  const usuarios: Usuario[] = [
    { id: 'u-roberto', nome: 'Roberto Lima', email: 'admin@suntech.com.br', perfil: 'admin', ativo: true },
    { id: 'u-marina', nome: 'Marina Costa', email: 'marina@suntech.com.br', perfil: 'vendedor', ativo: true },
    { id: 'u-carlos', nome: 'Carlos Souza', email: 'carlos@suntech.com.br', perfil: 'vendedor', ativo: true },
  ];

  const clientes: Cliente[] = [];
  const negocios: Negocio[] = [];
  const tarefas: Tarefa[] = [];
  const interacoes: Interacao[] = [];

  type Linha = {
    cliente: string;
    cidade: string;
    tipo: TipoNegocio;
    titulo: string;
    valor: number | null;
    kwp?: number;
    etapa: Etapa;
    vendedor: string | null;
    origem: Origem;
    criadoHaDias: number;
    tarefa?: { tipo: TipoTarefa; descricao: string; emDias: number; hora: number; concluida?: boolean };
  };

  const linhas: Linha[] = [
    // Novo contato
    { cliente: 'Marcos Lima', cidade: 'Ji-Paraná', tipo: 'orcamento', titulo: 'Residencial · 6 kWp', valor: 24000, kwp: 6, etapa: 'novo', vendedor: null, origem: 'formulario', criadoHaDias: 0 },
    { cliente: 'Condomínio Aurora', cidade: 'Cacoal', tipo: 'atendimento', titulo: 'Dúvida sobre a conta de energia', valor: null, etapa: 'novo', vendedor: null, origem: 'chatbot_orcamento', criadoHaDias: 0 },
    { cliente: 'Lucas Ferreira', cidade: 'Ji-Paraná', tipo: 'limpeza', titulo: 'Limpeza de 8 painéis', valor: 450, etapa: 'novo', vendedor: null, origem: 'formulario', criadoHaDias: 1 },
    { cliente: 'Padaria Bom Pão', cidade: 'Ariquemes', tipo: 'orcamento', titulo: 'Comercial · 12 kWp', valor: 12500, kwp: 12, etapa: 'novo', vendedor: 'u-marina', origem: 'chatbot_simulacao', criadoHaDias: 2, tarefa: { tipo: 'ligacao', descricao: 'Primeiro contato', emDias: -1, hora: 16 } },
    // Em atendimento
    { cliente: 'Rafael Torres', cidade: 'Ji-Paraná', tipo: 'limpeza', titulo: 'Limpeza de 18 painéis', valor: 900, etapa: 'atendimento', vendedor: 'u-marina', origem: 'base', criadoHaDias: 3, tarefa: { tipo: 'ligacao', descricao: 'Confirmar data da limpeza', emDias: -1, hora: 10 } },
    { cliente: 'Clínica Vida', cidade: 'Cacoal', tipo: 'atendimento', titulo: 'Inversor com alerta de falha', valor: null, etapa: 'atendimento', vendedor: 'u-carlos', origem: 'base', criadoHaDias: 1, tarefa: { tipo: 'visita', descricao: 'Verificar inversor', emDias: 1, hora: 9 } },
    { cliente: 'Ana Souza', cidade: 'Porto Velho', tipo: 'orcamento', titulo: 'Residencial · 5 kWp', valor: 22000, kwp: 5, etapa: 'atendimento', vendedor: 'u-carlos', origem: 'formulario', criadoHaDias: 4, tarefa: { tipo: 'ligacao', descricao: 'Tirar dúvidas sobre financiamento', emDias: 0, hora: 17 } },
    // Agendado
    { cliente: 'Fazenda Boa Vista', cidade: 'Ouro Preto do Oeste', tipo: 'orcamento', titulo: 'Rural · 30 kWp', valor: 64000, kwp: 30, etapa: 'agendado', vendedor: 'u-carlos', origem: 'indicacao', criadoHaDias: 7, tarefa: { tipo: 'visita', descricao: 'Visita técnica na propriedade', emDias: 2, hora: 8 } },
    { cliente: 'Helena Prado', cidade: 'Ji-Paraná', tipo: 'limpeza', titulo: 'Limpeza de 12 painéis', valor: 600, etapa: 'agendado', vendedor: 'u-marina', origem: 'base', criadoHaDias: 5, tarefa: { tipo: 'visita', descricao: 'Equipe de limpeza no local', emDias: 1, hora: 14 } },
    { cliente: 'Escola Pequeno Sol', cidade: 'Cacoal', tipo: 'atendimento', titulo: 'Visita técnica de manutenção', valor: null, etapa: 'agendado', vendedor: 'u-marina', origem: 'chatbot_orcamento', criadoHaDias: 6, tarefa: { tipo: 'visita', descricao: 'Manutenção preventiva', emDias: -1, hora: 8 } },
    // Proposta enviada
    { cliente: 'Mercado Central', cidade: 'Ariquemes', tipo: 'orcamento', titulo: 'Comercial · 20 kWp', valor: 41000, kwp: 20, etapa: 'proposta', vendedor: 'u-carlos', origem: 'formulario', criadoHaDias: 13, tarefa: { tipo: 'tarefa', descricao: 'Retornar sobre a proposta', emDias: -2, hora: 11 } },
    { cliente: 'Julia Mendes', cidade: 'Ji-Paraná', tipo: 'orcamento', titulo: 'Residencial · 4 kWp', valor: 18500, kwp: 4, etapa: 'proposta', vendedor: 'u-marina', origem: 'chatbot_simulacao', criadoHaDias: 10, tarefa: { tipo: 'ligacao', descricao: 'Negociar forma de pagamento', emDias: 3, hora: 10 } },
    // Concluídos
    { cliente: 'Oficina Silva', cidade: 'Ji-Paraná', tipo: 'limpeza', titulo: 'Limpeza de 24 painéis', valor: 1200, etapa: 'concluido', vendedor: 'u-marina', origem: 'base', criadoHaDias: 14, tarefa: { tipo: 'tarefa', descricao: 'Pós-venda: pesquisa de satisfação', emDias: 15, hora: 10 } },
    { cliente: 'Pedro Alves', cidade: 'Presidente Médici', tipo: 'orcamento', titulo: 'Residencial · 8 kWp', valor: 32000, kwp: 8, etapa: 'concluido', vendedor: 'u-carlos', origem: 'indicacao', criadoHaDias: 21, tarefa: { tipo: 'visita', descricao: 'Instalação do sistema', emDias: 7, hora: 8 } },
    { cliente: 'Supermercado Rocha', cidade: 'Cacoal', tipo: 'orcamento', titulo: 'Comercial · 28 kWp', valor: 58000, kwp: 28, etapa: 'concluido', vendedor: 'u-carlos', origem: 'formulario', criadoHaDias: 45 },
    { cliente: 'Igreja Nova Vida', cidade: 'Ji-Paraná', tipo: 'limpeza', titulo: 'Limpeza de 30 painéis', valor: 800, etapa: 'concluido', vendedor: 'u-marina', origem: 'chatbot_orcamento', criadoHaDias: 62 },
    { cliente: 'Auto Posto Estrela', cidade: 'Ariquemes', tipo: 'orcamento', titulo: 'Comercial · 35 kWp', valor: 75000, kwp: 35, etapa: 'concluido', vendedor: 'u-carlos', origem: 'indicacao', criadoHaDias: 95 },
    { cliente: 'Família Batista', cidade: 'Ji-Paraná', tipo: 'orcamento', titulo: 'Residencial · 7 kWp', valor: 26000, kwp: 7, etapa: 'concluido', vendedor: 'u-marina', origem: 'formulario', criadoHaDias: 122 },
    { cliente: 'Sítio Recanto', cidade: 'Ouro Preto do Oeste', tipo: 'atendimento', titulo: 'Ajuste no monitoramento', valor: null, etapa: 'concluido', vendedor: 'u-marina', origem: 'base', criadoHaDias: 150 },
    // Perdidos (não aparecem no funil, mas entram na taxa de conversão)
    { cliente: 'Loja Ponto Certo', cidade: 'Cacoal', tipo: 'orcamento', titulo: 'Comercial · 9 kWp', valor: 19000, kwp: 9, etapa: 'perdido', vendedor: 'u-marina', origem: 'chatbot_simulacao', criadoHaDias: 50 },
    { cliente: 'Restaurante Sabor da Terra', cidade: 'Porto Velho', tipo: 'orcamento', titulo: 'Comercial · 14 kWp', valor: 28000, kwp: 14, etapa: 'perdido', vendedor: 'u-carlos', origem: 'formulario', criadoHaDias: 80 },
    { cliente: 'Hotel Rio Machado', cidade: 'Ji-Paraná', tipo: 'orcamento', titulo: 'Comercial · 45 kWp', valor: 90000, kwp: 45, etapa: 'perdido', vendedor: 'u-carlos', origem: 'indicacao', criadoHaDias: 130 },
  ];

  linhas.forEach((l, i) => {
    const n = i + 1;
    const clienteId = `c-${n}`;
    const negocioId = `n-${n}`;
    const criadoEm = em(-l.criadoHaDias, 8 + (n % 9), (n * 7) % 60);

    clientes.push({
      id: clienteId,
      nome: l.cliente,
      telefone: `(69) 99000-${String(1000 + n).slice(-4)}`,
      email: null,
      cidade: l.cidade,
      origem: l.origem,
      criadoEm,
    });

    negocios.push({
      id: negocioId,
      clienteId,
      tipo: l.tipo,
      titulo: l.titulo,
      valor: l.valor,
      kwp: l.kwp ?? null,
      etapa: l.etapa,
      vendedorId: l.vendedor,
      origem: l.origem,
      criadoEm,
      atualizadoEm: criadoEm,
    });

    interacoes.push({
      id: `i-${n}-1`,
      negocioId,
      usuarioId: null,
      tipo: 'sistema',
      texto: `Lead registrado · ${NOME_ORIGEM[l.origem]}`,
      criadoEm,
    });

    if (l.vendedor) {
      const vendedor = usuarios.find((u) => u.id === l.vendedor)!;
      interacoes.push({
        id: `i-${n}-2`,
        negocioId,
        usuarioId: 'u-roberto',
        tipo: 'sistema',
        texto: `Atribuído a ${vendedor.nome}`,
        criadoEm,
      });
    }

    if (l.tarefa) {
      tarefas.push({
        id: `t-${n}`,
        negocioId,
        tipo: l.tarefa.tipo,
        descricao: l.tarefa.descricao,
        dataHora: em(l.tarefa.emDias, l.tarefa.hora),
        concluida: l.tarefa.concluida ?? false,
        responsavelId: l.vendedor,
      });
    }
  });

  return { usuarios, clientes, negocios, tarefas, interacoes };
}
