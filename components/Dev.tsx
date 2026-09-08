import { cobertura, pendencias, type Gravidade } from "@/lib/manutencao";
import { carregaEstadoDasFontes } from "@/lib/dados";
import { dataPorExtenso } from "@/lib/prazos";

/**
 * Console de manutenção. Não é para o público, e não é secreto.
 *
 * O site é estático: não existe servidor para receber uma ação, então esta
 * página não altera nada. Ela responde "o que está esperando alguém fazer" e
 * entrega o comando pronto de cada pendência. Quem publica dado continua sendo
 * gente, por pull request — regra 3 do CLAUDE.md.
 *
 * Sem login de propósito. Um site estático não tem onde guardar sessão, e
 * inventar uma esbarraria na seção 6 do CLAUDE.md. Como consequência, quem
 * tiver o endereço vê a página: nada de secreto pode entrar aqui. O que há
 * nela é o mesmo dado público que já está no repositório, só reunido.
 */

const CORES: Record<Gravidade, { borda: string; rotulo: string }> = {
  erro: { borda: "border-processo", rotulo: "Erro" },
  atencao: { borda: "border-processo", rotulo: "Pendente" },
  nota: { borda: "border-marca-linha", rotulo: "Dívida conhecida" },
};

const EXPLICA: Record<Gravidade, string> = {
  erro: "Dado que pode enganar alguém agora.",
  atencao: "Trabalho pendente que ainda não engana ninguém.",
  nota: "O que já se sabe e se aceita. Registrado para não virar esquecimento.",
};

export default function Dev() {
  const lista = pendencias();
  const numeros = cobertura();
  const estado = carregaEstadoDasFontes();

  const grupos: Gravidade[] = ["erro", "atencao", "nota"];
  const contagem = (g: Gravidade) => lista.filter((p) => p.gravidade === g).length;

  return (
    <div className="mx-auto max-w-[900px] px-4 py-10 md:px-7">
      <h1 className="text-[30px] font-bold tracking-tight text-marca md:text-[34px]">
        Console de manutenção
      </h1>
      <p className="mt-3 max-w-[70ch]">
        Página para quem mantém o site. Ela não altera nada: o site é estático e
        não tem servidor para receber uma ação. O que ela faz é reunir o que
        está esperando alguém fazer, e dar o comando de cada coisa.
      </p>
      <p className="mt-3 max-w-[70ch] border-l-4 border-marca-linha pl-4 text-[14px]">
        Não tem login, porque site estático não tem onde guardar sessão. Logo,
        quem tiver este endereço vê esta página — nada de secreto entra aqui. O
        que está abaixo é o mesmo dado público que já está no repositório.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        {grupos.map((g) => (
          <div key={g} className="border border-marca-linha px-4 py-3">
            <div className="text-[26px] font-bold text-marca">{contagem(g)}</div>
            <div className="text-[13px]">{CORES[g].rotulo}</div>
          </div>
        ))}
        <div className="border border-marca-linha px-4 py-3">
          <div className="text-[26px] font-bold text-marca">
            {estado ? dataPorExtenso(estado.conferido_em) : "—"}
          </div>
          <div className="text-[13px]">Última conferência das fontes</div>
        </div>
      </div>

      {lista.length === 0 && (
        <p className="mt-8 font-bold">Nada pendente. Raro, desconfie.</p>
      )}

      {grupos.map((g) =>
        contagem(g) === 0 ? null : (
          <section key={g} className="mt-10">
            <h2 className="text-[24px] font-bold tracking-tight text-marca">
              {CORES[g].rotulo} ({contagem(g)})
            </h2>
            <p className="mt-1 text-[14px]">{EXPLICA[g]}</p>
            <ul>
              {lista
                .filter((p) => p.gravidade === g)
                .map((p) => (
                  <li key={p.id} className={`mt-4 border-l-4 ${CORES[g].borda} pl-4`}>
                    <h3 className="font-bold text-marca">{p.titulo}</h3>
                    <p className="mt-1 max-w-[70ch] text-[15px]">{p.detalhe}</p>
                    {p.comando !== null && (
                      <pre className="mt-2 overflow-x-auto border border-marca-linha bg-white px-3 py-2 text-[13px]">
                        <code>{p.comando}</code>
                      </pre>
                    )}
                  </li>
                ))}
            </ul>
          </section>
        ),
      )}

      <section className="mt-12">
        <h2 className="text-[24px] font-bold tracking-tight text-marca">
          O que está publicado
        </h2>
        <dl className="mt-3 border-t border-marca-linha">
          {numeros.map((c) => (
            <div
              key={c.rotulo}
              className="flex flex-wrap items-baseline gap-x-3 border-b border-marca-linha py-2"
            >
              <dt className="min-w-[16rem] flex-1 font-bold">{c.rotulo}</dt>
              <dd className="text-[20px] font-bold text-marca">{c.valor}</dd>
              {c.nota !== null && (
                <dd className="w-full text-[13px]">{c.nota}</dd>
              )}
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-12">
        <h2 className="text-[24px] font-bold tracking-tight text-marca">
          Comandos
        </h2>
        <p className="mt-1 max-w-[70ch] text-[14px]">
          A ordem importa em dois casos: o CNES precisa baixar antes de extrair,
          e a prospecção precisa da população antes de ordenar a fila.
        </p>
        <dl className="mt-4 space-y-3 text-[14px]">
          {[
            ["Valida todo o data/ contra os schemas", "npm run valida-dados"],
            ["Confere as fontes e atualiza a data de conferência", "npm run verifica-fontes"],
            ["Confere onde está a REMUME de cada município", "npm run acha-remume"],
            ["Descobre o site das prefeituras da fila", "npm run catalogo-prefeituras -- --da-prospeccao"],
            ["Procura atos de REMUME no Querido Diário", "npm run prospecta-remume -- --limite 60"],
            ["Testa a triagem da prospecção", "npm run testa-prospeccao"],
            ["Traz a rede de saúde do cadastro federal", "npm run baixa-cnes -- <municipio> && npm run extrai-cnes -- <municipio>"],
            ["Relatório de grafias que não casam com a RENAME", "npm run revisa-equivalencias"],
          ].map(([texto, comando]) => (
            <div key={comando}>
              <dt>{texto}</dt>
              <dd>
                <pre className="mt-1 overflow-x-auto border border-marca-linha bg-white px-3 py-2 text-[13px]">
                  <code>{comando}</code>
                </pre>
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
