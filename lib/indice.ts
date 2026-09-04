/**
 * Monta, no build, o índice que o navegador recebe pronto.
 * Roda só no servidor.
 */
import { montaIndice, type EntradaBusca } from "./busca";
import { listaRemedios } from "./remedios";

export function indiceSerializado(municipioId: string): string {
  const entradas: EntradaBusca[] = listaRemedios(municipioId).map((r) => ({
    id: r.slug,
    // Todas as grafias da fonte entram: quem digita qualquer uma acha.
    nome: r.grafias.join(" "),
    populares: r.nomes_populares.join(" "),
    tem_para_levar: r.tem_para_levar,
  }));
  return JSON.stringify(montaIndice(entradas));
}
