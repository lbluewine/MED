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
}: {
  pontos: PontoMapa[];
  centro: { lat: number; lng: number };
}) {
  const div = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!div.current) return;
    const mapa = L.map(div.current).setView([centro.lat, centro.lng], 12);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "Mapa: OpenStreetMap",
    }).addTo(mapa);

    for (const p of pontos) {
      L.marker([p.lat, p.lng], {
        // Ícone desenhado com CSS, para não baixar imagem de fora.
        icon: L.divIcon({
          className: "",
          html:
            '<span style="display:block;width:18px;height:18px;border-radius:50%;' +
            'background:#0B6E4F;border:3px solid #fff;box-shadow:0 0 0 1px #1A1A1A"></span>',
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        }),
      })
        .addTo(mapa)
        .bindPopup(`<a href="${p.href}">${p.nome}</a>`);
    }

    return () => {
      mapa.remove();
    };
  }, [pontos, centro]);

  return (
    <div
      ref={div}
      role="application"
      aria-label="Mapa das unidades"
      className="h-[380px] w-full border-2 border-texto"
    />
  );
}
