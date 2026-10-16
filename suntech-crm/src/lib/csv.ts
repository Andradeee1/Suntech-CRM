/** Gera CSV com ";" (padrão do Excel em português) e BOM para manter os acentos. */
export function gerarCsv(linhas: (string | number | null)[][]): string {
  const escapar = (v: string | number | null) => {
    const s = v == null ? '' : String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return '﻿' + linhas.map((l) => l.map(escapar).join(';')).join('\r\n');
}

export function baixarArquivo(nome: string, conteudo: string, tipo = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}
