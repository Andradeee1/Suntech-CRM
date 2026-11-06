/**
 * Guarda os ARQUIVOS dos anexos no navegador (IndexedDB), enquanto o sistema
 * usa dados de demonstração. O localStorage não serve para isso: o limite dele
 * é de poucos megabytes.
 *
 * No Supabase, estas três funções são trocadas pelo Supabase Storage:
 *   salvar  -> supabase.storage.from('anexos').upload(caminho, arquivo)
 *   ler     -> supabase.storage.from('anexos').createSignedUrl(caminho, 60)
 *   apagar  -> supabase.storage.from('anexos').remove([caminho])
 */
const NOME_BANCO = 'suntech-crm-arquivos';
const LOJA = 'arquivos';

function abrir(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const pedido = indexedDB.open(NOME_BANCO, 1);
    pedido.onupgradeneeded = () => pedido.result.createObjectStore(LOJA);
    pedido.onsuccess = () => resolve(pedido.result);
    pedido.onerror = () => reject(pedido.error);
  });
}

async function executar<T>(modo: IDBTransactionMode, acao: (loja: IDBObjectStore) => IDBRequest): Promise<T> {
  const banco = await abrir();
  return new Promise<T>((resolve, reject) => {
    const transacao = banco.transaction(LOJA, modo);
    const pedido = acao(transacao.objectStore(LOJA));
    transacao.oncomplete = () => {
      banco.close();
      resolve(pedido.result as T);
    };
    transacao.onerror = () => {
      banco.close();
      reject(transacao.error);
    };
  });
}

export function salvarArquivo(id: string, arquivo: Blob): Promise<void> {
  return executar('readwrite', (loja) => loja.put(arquivo, id));
}

export async function lerArquivo(id: string): Promise<Blob | null> {
  return (await executar<Blob | undefined>('readonly', (loja) => loja.get(id))) ?? null;
}

export function apagarArquivo(id: string): Promise<void> {
  return executar('readwrite', (loja) => loja.delete(id));
}

export function apagarTodos(): Promise<void> {
  return executar('readwrite', (loja) => loja.clear());
}
