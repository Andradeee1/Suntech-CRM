import { Icone } from './Icone';

/** Mesmo logo do cabeçalho do site: sol amarelo + "Sun" amarelo + "Tech" verde. */
export function Logo({ comCrm = true }: { comCrm?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Icone nome="sol" className="size-7 text-suntech-yellow" />
      <span className="text-xl font-bold">
        <span className="text-suntech-yellow">Sun</span>
        <span className="text-suntech-green">Tech</span>
      </span>
      {comCrm && (
        <span className="rounded bg-suntech-green/10 px-1.5 py-0.5 text-[11px] font-bold tracking-wider text-suntech-green">CRM</span>
      )}
    </span>
  );
}
