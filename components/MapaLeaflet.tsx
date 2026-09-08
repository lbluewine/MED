"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { PontoMapa } from "./Mapa";

/**
 * O mapa em si. Fica separado de propósito: este arquivo carrega o Leaflet e
 * o CSS dele, e só é baixado quando a pessoa aperta o botão.
 */
export default function MapaLeaflet({
  pontos,
  centro,
  /** Id do ponto para o mapa se aproximar e abrir o balão. */
  foco = null,
  rotulo = "Mapa das unidades",
}: {
  pontos: PontoMapa[];
  centro: { lat: number; lng: number };
  foco?: string | null;
  rotulo?: string;
}) {
  const div = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<L.Map | null>(null);
  const marcadores = useRef(new Map<string, L.Marker>());

  useEffect(() => {
    if (!div.current) return;
    const mapa = L.map(div.current).setView([centro.lat, centro.lng], 12);
    mapaRef.current = mapa;
    // Cópia local para a limpeza não depender do que o ref for na hora dela.
    const dosMarcadores = marcadores.current;
    dosMarcadores.clear();

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "Mapa: OpenStreetMap",
    }).addTo(mapa);

    for (const p of pontos) {
      const marcador = L.marker([p.lat, p.lng], {
        // Ícone desenhado com CSS, para não baixar imagem de fora.
        // O ponto aproximado é vazado: quem olha o mapa vê que aquele não é
        // a porta, é o trecho da rua.
        icon: L.divIcon({
          className: "",
          html: p.aproximado
            ? '<span style="display:block;width:18px;height:18px;border-radius:50%;' +
              'background:#fff;border:4px solid #0B6E4F;box-shadow:0 0 0 1px #1A1A1A"></span>'
            : '<span style="display:block;width:18px;height:18px;border-radius:50%;' +
              'background:#0B6E4F;border:3px solid #fff;box-shadow:0 0 0 1px #1A1A1A"></span>',
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        }),
      })
        .addTo(mapa)
        .bindPopup(
          `<a href="${p.href}">${p.nome}</a>` +
            (p.aproximado ? "<br><small>Ponto aproximado, neste trecho da rua.</small>" : ""),
        );
      dosMarcadores.set(p.id, marcador);
    }

    return () => {
      mapa.remove();
      mapaRef.current = null;
      dosMarcadores.clear();
    };
  }, [pontos, centro]);

  // Quem clicou num nome da lista quer ver aquele ponto, não o mapa inteiro.
  useEffect(() => {
    if (!foco) return;
    const marcador = marcadores.current.get(foco);
    const mapa = mapaRef.current;
    if (!marcador || !mapa) return;
    mapa.flyTo(marcador.getLatLng(), 17, { duration: 0.6 });
    marcador.openPopup();
  }, [foco]);

  return (
    <div
      ref={div}
      role="application"
      aria-label={rotulo}
      className="h-[380px] w-full border-2 border-texto"
    />
  );
}
