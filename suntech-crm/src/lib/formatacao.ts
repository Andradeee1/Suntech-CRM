const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

/** 24000 -> "R$ 24.000" */
export function formatarMoeda(valor: number): string {
  return moeda.format(valor);
}

/** null -> "Valor indefinido" */
export function formatarValor(valor: number | null): string {
  return valor == null ? 'Valor indefinido' : formatarMoeda(valor);
}

/** ISO -> "15/10" */
export function formatarDia(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

/** ISO -> "15/10 · 14:30" */
export function formatarDataHora(iso: string): string {
  const d = new Date(iso);
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${formatarDia(iso)} · ${hora}`;
}

/** Data relativa curta para a próxima tarefa: "hoje 17:00", "amanhã 09:00", "18/10". */
export function formatarPrazo(iso: string, agora: Date = new Date()): string {
  const d = new Date(iso);
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate()).getTime();
  const dia = 24 * 60 * 60 * 1000;
  const t = d.getTime();
  if (t >= inicioHoje && t < inicioHoje + dia) return `hoje ${hora}`;
  if (t >= inicioHoje + dia && t < inicioHoje + 2 * dia) return `amanhã ${hora}`;
  if (t >= inicioHoje - dia && t < inicioHoje) return `ontem ${hora}`;
  return formatarDia(iso);
}

/** "Marina Costa" -> "MC" */
export function iniciais(nome: string): string {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
}

/** Mantém só os dígitos e monta o link do WhatsApp com DDI 55. */
export function linkWhatsApp(telefone: string): string {
  const digitos = telefone.replace(/\D/g, '');
  const comDdi = digitos.startsWith('55') ? digitos : `55${digitos}`;
  return `https://wa.me/${comDdi}`;
}

/** Converte "R$ 1.234,50" ou "1234,5" em número. Vazio -> null. */
export function lerValor(texto: string): number | null {
  const limpo = texto.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  if (limpo.trim() === '') return null;
  const n = Number(limpo);
  return Number.isFinite(n) && n >= 0 ? n : null;
}
