"use client";

import { useState } from "react";
import { distanciaKm, distanciaTexto } from "@/lib/geo";

/**
 * Mostra a que distância cada unidade está de onde a pessoa está agora.
 *
 * Antes disso o site mostrava a distância até o centro de Criciúma, o que dava
 * um número que parecia ser da pessoa e não era. Ou a distância é a dela, ou
 * não se mostra distância nenhuma.
 *
 * A localização é pedida só quando a pessoa clica, nunca ao abrir a página, e
 * a coordenada não sai do navegador: o cálculo é aqui e o resultado é escrito
 * direto nos espaços que a lista já deixou prontos. Nada vai para o servidor,
 * nada fica gravado. Ver LGPD em docs/STACK.md.
 *
 * Sem JavaScript, ou com a permissão negada, a lista continua inteira — só
 * sem os quilômetros.
 */
export default function MinhaDistancia({
  pontos,
}: {
  pontos: { id: string; lat: number; lng: number }[];
}) {
  const [estado, setEstado] = useState<"parado" | "pedindo" | "pronto" | "negado" | "falhou">(
    "parado",
  );

  function pedir() {
    if (!("geolocation" in navigator)) {
      setEstado("falhou");
      return;
    }
    setEstado("pedindo");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const eu = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        for (const p of pontos) {
          const alvo = document.querySelector<HTMLElement>(
            `[data-distancia="${p.id}"]`,
          );
          if (alvo) alvo.textContent = ` — ${distanciaTexto(distanciaKm(eu, p))} de você`;
        }
        setEstado("pronto");
      },
      (erro) => setEstado(erro.code === erro.PERMISSION_DENIED ? "negado" : "falhou"),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  if (estado === "pronto") {
    return (
      <p className="mt-4 text-texto-suave">
        As distâncias abaixo saem de onde você está agora, em linha reta. O
        caminho de carro ou de ônibus é maior.
      </p>
    );
  }

  return (
    <div className="nao-imprime mt-4">
      <button
        type="button"
        onClick={pedir}
        disabled={estado === "pedindo"}
        className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[var(--radius-botao)] border-2 border-marca-link bg-fundo px-4 text-[19px] font-bold text-marca-link hover:bg-marca-fundo disabled:opacity-60"
      >
        {estado === "pedindo" ? "Procurando..." : "Ver qual fica mais perto de mim"}
      </button>
      {estado === "negado" && (
        <p className="mt-2 max-w-[65ch] text-texto-suave">
          Você não liberou a localização, então não dá para calcular a
          distância. O endereço e o telefone de cada lugar continuam na lista.
        </p>
      )}
      {estado === "falhou" && (
        <p className="mt-2 max-w-[65ch] text-texto-suave">
          Não conseguimos descobrir onde você está. O endereço e o telefone de
          cada lugar continuam na lista.
        </p>
      )}
    </div>
  );
}
