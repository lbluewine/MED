/**
 * Monta, no build, o índice que o navegador recebe pronto.
 * Roda só no servidor.
 */
import { montaIndice, type EntradaBusca } from "./busca";
import { municipiosDaUf } from "./dados";
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

/**
 * As cidades de um estado como texto, uma por linha: `Nome|slug`.
 *
 * Texto e não lista de objetos porque isto atravessa a fronteira do servidor
 * para o navegador. Em Minas Gerais são 853 cidades: como JSON, cada uma
 * carrega o nome das chaves de novo e a página passa de meio megabyte. Como
 * linha, sobram os dois dados que o campo precisa. Ver `docs/STACK.md`.
 */
export function cidadesSerializadas(uf: string): string {
  return municipiosDaUf(uf)
    .map((m) => `${m.nome}|${m.slug}`)
    .join("\n");
}
