/**
 * Distância em linha reta até o centro do município.
 *
 * Não é a distância de carro nem a pé — é só para ordenar "o que fica perto",
 * do jeito que a REMUME já organiza por distrito. Precisão de rota fica para
 * quando o site tiver mapa de rota de verdade.
 */
const RAIO_TERRA_KM = 6371;

export function distanciaKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return RAIO_TERRA_KM * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** "0,4 km" ou "7,4 km", no jeito que se fala em português. */
export function distanciaTexto(km: number): string {
  return `${km.toFixed(1).replace(".", ",")} km`;
}
