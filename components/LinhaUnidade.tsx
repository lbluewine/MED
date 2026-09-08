import type { Unidade } from "@/lib/schema";

/**
 * Uma unidade dentro da lista de "Onde pegar": nome, endereço, horário e a
 * distância — que só aparece se a pessoa liberar a localização.
 *
 * A linha inteira é o link. O telefone não vira link aqui porque um link
 * dentro de outro não é HTML válido: quem quer ligar abre a página da unidade,
 * onde o botão é grande.
 */
export default function LinhaUnidade({
  unidade,
  municipioId,
}: {
  unidade: Unidade;
  ddd: string;
  municipioId: string;
}) {
  const { endereco: e } = unidade;

  return (
    <a
      href={`/${municipioId}/unidade/${unidade.id}`}
      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-5 gap-y-2.5 border-b border-divisoria px-6 py-4 text-texto no-underline last:border-b-0 hover:bg-marca-veu"
    >
      <span>
        <span className="mb-1 block font-semibold text-marca-link">
          {unidade.nome}
        </span>
        <span className="block text-[15px] text-texto-suave">
          {e.logradouro}
          {e.bairro ? ` — ${e.bairro}` : ""}
        </span>
        {unidade.restricao && (
          <span className="mt-2 block rounded-r-lg border-l-4 border-[#b57505] bg-[#fdf5e6] px-3 py-2 text-[15px] leading-normal text-[#5a4413]">
            <span aria-hidden="true">! </span>
            {unidade.restricao}
          </span>
        )}
      </span>
      <span className="text-right">
        {unidade.horarios.length > 0 && (
          <span className="block text-[15px] text-texto-suave">
            {unidade.horarios.map((h) => `${h.abre} às ${h.fecha}`).join(" e ")}
          </span>
        )}
        {/*
          Fica vazio até a pessoa liberar a localização. Ver
          components/MinhaDistancia.tsx: a distância só aparece se for a dela.
        */}
        {e.geo && (
          <span
            data-distancia={unidade.id}
            className="block font-mono text-sm text-marca-link"
          />
        )}
      </span>
    </a>
  );
}
