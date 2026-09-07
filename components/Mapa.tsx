"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

export type PontoMapa = {
  id: string;
  nome: string;
  lat: number;
  lng: number;
  href: string;
  /** Ponto calculado entre endereços vizinhos, não o endereço em si. */
  aproximado?: boolean;
};

const MapaLeaflet = dynamic(() => import("./MapaLeaflet"), {
  ssr: false,
  loading: () => <p className="mt-6">Abrindo o mapa…</p>,
});

/**
 * O mapa só carrega quando a pessoa pede.
 *
 * Duas razões. Privacidade: buscar os quadradinhos do mapa entrega o IP de
 * quem lê para o OpenStreetMap, e neste site isso é dado de saúde. Dinheiro:
 * mapa gasta muitos dados móveis, e a lista de endereços logo abaixo já
 * responde a pergunta.
 *
 * Sem JavaScript o botão não aparece e a lista continua inteira.
 */
export default function Mapa({
  pontos,
  centro,
}: {
  pontos: PontoMapa[];
  centro: { lat: number; lng: number };
}) {
  const [aberto, setAberto] = useState(false);

  if (aberto) {
    return (
      <div className="nao-imprime mt-6">
        <MapaLeaflet pontos={pontos} centro={centro} />
        <p className="mt-2 text-texto-suave">
          Mapa do OpenStreetMap. {pontos.length} locais com localização
          conferida.
        </p>
      </div>
    );
  }

  return (
    <div className="nao-imprime mt-6">
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="min-h-[48px] w-full border-2 border-texto px-4 py-3 text-[20px] font-bold"
      >
        Ver o mapa com {pontos.length} locais
      </button>
      <p className="mt-2 text-texto-suave">
        O mapa gasta bastante internet. A lista abaixo tem os mesmos endereços.
      </p>
    </div>
  );
}
