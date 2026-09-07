"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Cartao, { Pilula } from "./Cartao";
import type { PontoMapa } from "./Mapa";
import type { FarmaciaCredenciada } from "@/lib/schema";

const MapaLeaflet = dynamic(() => import("./MapaLeaflet"), {
  ssr: false,
  loading: () => <p className="px-5 py-4">Abrindo o mapa…</p>,
});

/**
 * As farmácias credenciadas, por bairro, ligadas ao mapa.
 *
 * Cada uma tem um botão "Ver no mapa" ao lado, escrito por extenso — nome
 * sublinhado não avisa o que vai acontecer ao ser clicado, e quem lê este site
 * muitas vezes não tem prática com tela.
 *
 * O botão é um link de verdade para o OpenStreetMap. Com JavaScript o clique é
 * interceptado e o ponto aparece no mapa aqui mesmo; sem JavaScript o link abre
 * o OSM naquele ponto. Ninguém fica com um botão que não faz nada.
 *
 * Farmácia sem coordenada não ganha botão: o endereço está logo abaixo, e um
 * botão que leva ao centro da cidade seria pior que botão nenhum.
 */
export default function FarmaciasCredenciadas({
  farmacias,
  centro,
}: {
  farmacias: FarmaciaCredenciada[];
  centro: { lat: number; lng: number };
}) {
  const [aberto, setAberto] = useState(false);
  const [foco, setFoco] = useState<string | null>(null);

  const identidade = (f: FarmaciaCredenciada) =>
    f.cnpj ?? `${f.razao_social}-${f.logradouro}`;

  // Memorizado porque o MapaLeaflet recria o mapa quando esta lista muda de
  // identidade — sem isto, cada clique redesenharia o mapa do zero.
  const pontos = useMemo<PontoMapa[]>(
    () =>
      farmacias
        .filter((f) => f.geo)
        .map((f) => ({
          id: identidade(f),
          nome: f.nome_fantasia ?? f.razao_social,
          lat: f.geo!.lat,
          lng: f.geo!.lng,
          href: `https://www.openstreetmap.org/?mlat=${f.geo!.lat}&mlon=${f.geo!.lng}#map=18/${f.geo!.lat}/${f.geo!.lng}`,
          aproximado: f.geo!.precisao === "aproximada",
        })),
    [farmacias],
  );

  const porBairro = useMemo(() => {
    const bairros = new Map<string, FarmaciaCredenciada[]>();
    for (const f of farmacias) {
      const bairro = f.bairro ?? "Bairro não informado";
      bairros.set(bairro, [...(bairros.get(bairro) ?? []), f]);
    }
    return [...bairros.entries()].sort(
      (a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], "pt-BR"),
    );
  }, [farmacias]);

  function mostraNoMapa(id: string) {
    setAberto(true);
    setFoco(id);
    document.getElementById("mapa-credenciadas")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  return (
    <>
      {pontos.length > 0 && (
        <Cartao id="mapa-credenciadas" className="nao-imprime mt-5 overflow-hidden">
          {aberto ? (
            <MapaLeaflet
              pontos={pontos}
              centro={centro}
              foco={foco}
              rotulo="Mapa das farmácias credenciadas"
            />
          ) : (
            <button
              type="button"
              onClick={() => setAberto(true)}
              className="min-h-[52px] w-full px-5 py-3 text-[17px] font-semibold text-marca-link hover:bg-marca-veu"
            >
              Ver o mapa com {pontos.length} farmácias
            </button>
          )}
        </Cartao>
      )}

      <div className="mt-4 flex flex-col gap-3.5">
        {porBairro.map(([bairro, doBairro]) => (
          <Cartao as="section" key={bairro} className="overflow-hidden">
            <div className="flex flex-wrap items-center gap-3 border-b border-borda-cartao bg-marca-veu px-6 py-4">
              <h3 className="text-[18px] font-bold text-marca">{bairro}</h3>
              <Pilula>{doBairro.length}</Pilula>
            </div>
            <ul className="px-6 py-2">
              {doBairro.map((farmacia) => {
                const id = identidade(farmacia);
                const nome = farmacia.nome_fantasia ?? farmacia.razao_social;
                const ponto = pontos.find((p) => p.id === id);
                return (
                  <li
                    key={id}
                    className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 border-b border-divisoria py-3 leading-normal last:border-b-0"
                  >
                    <div className="min-w-0 flex-1 basis-[220px]">
                      <span className="font-semibold text-marca">{nome}</span>
                      <br />
                      <span className="text-[#33506f]">
                        {farmacia.logradouro}
                        {farmacia.complemento ? `, ${farmacia.complemento}` : ""}
                        {farmacia.cep ? ` — CEP ${farmacia.cep}` : ""}
                      </span>
                      {/*
                        Ponto interpolado entre os números vizinhos que o
                        cadastro tem. Dizer isso é a diferença entre "é aqui" e
                        "é por aqui", e quem vai a pé precisa saber qual dos
                        dois está lendo.
                      */}
                      {farmacia.geo?.precisao === "aproximada" && (
                        <span className="mt-1 block text-[13.5px] text-texto-suave">
                          No mapa, o ponto é aproximado: fica neste trecho da rua.
                        </span>
                      )}
                      {farmacia.divergencias.map((d) => (
                        <span
                          key={d}
                          className="mt-1 block text-[13.5px] text-texto-suave"
                        >
                          {d}
                        </span>
                      ))}
                    </div>

                    {ponto && (
                      <a
                        href={ponto.href}
                        rel="noreferrer"
                        onClick={(e) => {
                          e.preventDefault();
                          mostraNoMapa(id);
                        }}
                        className="nao-imprime inline-flex min-h-[40px] flex-none items-center gap-2 rounded-[var(--radius-botao)] border border-marca-linha bg-marca-veu px-3.5 text-[14.5px] font-semibold text-marca-link no-underline hover:border-marca-link"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path
                            d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                          <circle cx="12" cy="10" r="2.4" fill="currentColor" />
                        </svg>
                        Ver no mapa
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </Cartao>
        ))}
      </div>
    </>
  );
}
