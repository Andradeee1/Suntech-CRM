/**
 * Lista de anexos com envio de arquivos (fotos do imóvel, projeto, contrato...).
 * Usada na ficha do negócio (Quadro de negócios) e na ficha do cliente (Clientes).
 */
import { useEffect, useRef, useState, type DragEvent } from 'react';
import { useCrm } from '../contexts/CrmContext';
import { ANEXO_ACEITOS, NOME_CATEGORIA_ANEXO } from '../lib/constantes';
import { formatarDia } from '../lib/formatacao';
import type { Anexo, CategoriaAnexo } from '../types';
import { botao, campo, rotulo } from './Botoes';
import { Icone } from './Icone';

function tamanhoLegivel(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

const ehImagem = (a: Anexo) => a.tipoArquivo.startsWith('image/');

export function PainelAnexos({
  clienteId,
  negocioId,
  anexos,
  podeEditar,
}: {
  clienteId: string;
  /** Negócio ao qual os novos arquivos ficam ligados (null = anexo do cliente). */
  negocioId: string | null;
  anexos: Anexo[];
  podeEditar: boolean;
}) {
  const crm = useCrm();
  const entrada = useRef<HTMLInputElement>(null);
  const [categoria, setCategoria] = useState<CategoriaAnexo>('fotos');
  const [enviando, setEnviando] = useState(false);
  const [sobre, setSobre] = useState(false);

  async function enviar(lista: FileList | null) {
    if (!lista || lista.length === 0) return;
    setEnviando(true);
    await crm.enviarAnexos({ clienteId, negocioId, categoria, arquivos: Array.from(lista) });
    setEnviando(false);
    if (entrada.current) entrada.current.value = '';
  }

  function soltar(e: DragEvent) {
    e.preventDefault();
    setSobre(false);
    if (podeEditar) void enviar(e.dataTransfer.files);
  }

  const ordenados = [...anexos].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));

  return (
    <div className="flex flex-col gap-3">
      {podeEditar && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setSobre(true);
          }}
          onDragLeave={() => setSobre(false)}
          onDrop={soltar}
          className={`flex flex-col gap-2.5 rounded-lg border-2 border-dashed p-3 transition-colors ${
            sobre ? 'border-suntech-yellow bg-amber-50' : 'border-gray-300'
          }`}
        >
          <div className="flex flex-wrap items-end gap-2">
            <label className="min-w-36 flex-1">
              <span className={rotulo}>Tipo do anexo</span>
              <select className={campo} value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaAnexo)}>
                {Object.entries(NOME_CATEGORIA_ANEXO).map(([id, nome]) => (
                  <option key={id} value={id}>
                    {nome}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className={botao.verde} disabled={enviando} onClick={() => entrada.current?.click()}>
              <Icone nome="clipe" />
              {enviando ? 'Enviando…' : 'Escolher arquivos'}
            </button>
          </div>
          <p className="text-xs text-gray-600">Ou arraste os arquivos para cá. Fotos, PDF, Word ou Excel, até 10 MB cada.</p>
          <input
            ref={entrada}
            type="file"
            multiple
            accept={ANEXO_ACEITOS}
            className="sr-only"
            aria-label="Escolher arquivos para anexar"
            onChange={(e) => void enviar(e.target.files)}
          />
        </div>
      )}

      {ordenados.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhum anexo ainda.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {ordenados.map((a) => (
            <ItemAnexo key={a.id} anexo={a} podeExcluir={podeEditar} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ItemAnexo({ anexo, podeExcluir }: { anexo: Anexo; podeExcluir: boolean }) {
  const crm = useCrm();
  const [miniatura, setMiniatura] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const negocio = anexo.negocioId ? crm.dados.negocios.find((n) => n.id === anexo.negocioId) : null;
  const autor = crm.usuarioPorId(anexo.enviadoPor)?.nome.split(' ')[0];

  // Carrega a miniatura das fotos
  useEffect(() => {
    if (!ehImagem(anexo)) return;
    let url: string | null = null;
    let ativo = true;
    void crm.urlDoAnexo(anexo.id).then((u) => {
      if (!u) return;
      if (ativo) {
        url = u;
        setMiniatura(u);
      } else URL.revokeObjectURL(u);
    });
    return () => {
      ativo = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [anexo.id]);

  async function abrir() {
    const url = await crm.urlDoAnexo(anexo.id);
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    if (ehImagem(anexo) || anexo.tipoArquivo === 'application/pdf') link.target = '_blank';
    else link.download = anexo.nome;
    link.rel = 'noopener';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  return (
    <li className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-2">
      <button
        type="button"
        onClick={() => void abrir()}
        className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-100 text-gray-500"
        aria-label={`Abrir ${anexo.nome}`}
      >
        {miniatura ? <img src={miniatura} alt="" className="size-full object-cover" /> : <Icone nome="arquivo" className="size-6" />}
      </button>
      <div className="min-w-0 flex-1">
        <button type="button" onClick={() => void abrir()} className="block max-w-full truncate text-left text-sm font-medium text-suntech-green hover:underline">
          {anexo.nome}
        </button>
        <p className="text-xs text-gray-600">
          {NOME_CATEGORIA_ANEXO[anexo.categoria]} · {tamanhoLegivel(anexo.tamanho)} · {formatarDia(anexo.criadoEm)}
          {autor && ` · ${autor}`}
        </p>
        {negocio && <p className="truncate text-xs text-gray-500">Negócio: {negocio.titulo}</p>}
      </div>
      {podeExcluir &&
        (confirmando ? (
          <span className="flex shrink-0 gap-1">
            <button type="button" className="rounded-md bg-red-700 px-2.5 py-1.5 text-xs font-semibold text-white" onClick={() => void crm.excluirAnexo(anexo.id)}>
              Excluir
            </button>
            <button type="button" className="rounded-md border border-gray-300 px-2.5 py-1.5 text-xs" onClick={() => setConfirmando(false)}>
              Cancelar
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmando(true)}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-red-50 hover:text-red-700"
            aria-label={`Excluir ${anexo.nome}`}
            title="Excluir"
          >
            <Icone nome="lixeira" />
          </button>
        ))}
    </li>
  );
}
