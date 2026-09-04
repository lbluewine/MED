import type { Proveniencia } from "@/lib/schema";
import { dadoDesatualizado, dataPorExtenso } from "@/lib/prazos";
import { dadoDesatualizado as frase } from "@/lib/textos";

/**
 * De onde veio o dado e quando foi conferido pela última vez.
 *
 * Vai em toda página que mostra dado. Mostrar "conferido hoje" numa lista de
 * 2024 é o ponto: conferido hoje quer dizer que hoje ela ainda é a lista
 * válida. Ver docs/DADOS.md.
 */
export default function NotaFonte({
  proveniencia,
  telefone,
}: {
  proveniencia: Proveniencia;
  telefone: string | null;
}) {
  const maisAntiga = proveniencia.reduce((a, b) =>
    a.verificado_em <= b.verificado_em ? a : b,
  );
  const velho = dadoDesatualizado(maisAntiga.verificado_em);

  return (
    <section className="mt-10 border-t-2 border-marca-linha pt-4">
      {velho && (
        <p className="mb-4 border-l-4 border-processo pl-4 font-bold">
          {frase(dataPorExtenso(maisAntiga.verificado_em), telefone)}
        </p>
      )}
      <h2 className="font-bold text-marca">De onde vem esta informação</h2>
      <ul className="mt-2">
        {proveniencia.map((f) => (
          <li key={f.fonte_nome} className="mt-2">
            <a className="underline" href={f.fonte_url} rel="noreferrer">
              {f.fonte_nome}
            </a>
            <br />
            <span className="text-texto-suave">
              Conferimos em {dataPorExtenso(f.verificado_em)}.
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
