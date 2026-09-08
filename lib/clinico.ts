/**
 * Porteiro do conteúdo clínico.
 *
 * Regra 2 do CLAUDE.md: nada clínico vai à tela sem revisão farmacêutica
 * registrada, autorizada por escrito e dentro do prazo. Este arquivo é o
 * único lugar que decide isso, para não haver uma segunda opinião no código.
 */
import type { Medicamento, Revisao } from "./schema";
import { revisaoVencida } from "./prazos";

/** A revisão vale hoje? */
export function revisaoValida(revisao: Revisao | null, hoje?: Date): revisao is Revisao {
  return (
    revisao !== null &&
    revisao.autorizacao_registrada &&
    !revisaoVencida(revisao.revisado_em, hoje)
  );
}

/** Os campos clínicos de uma ficha, ou null quando não podem ser publicados. */
export function camposClinicosPublicaveis(med: Medicamento, hoje?: Date) {
  if (!revisaoValida(med.revisao, hoje)) return null;
  return {
    como_tomar: med.como_tomar,
    se_esquecer: med.se_esquecer,
    como_guardar: med.como_guardar,
    efeitos_comuns: med.efeitos_comuns,
    quando_procurar_ajuda: med.quando_procurar_ajuda,
    revisao: med.revisao,
  };
}
