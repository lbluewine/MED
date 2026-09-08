import CartaoAcesso from "@/components/CartaoAcesso";
import CartaoInfo from "@/components/CartaoInfo";
import NotaFonte from "@/components/NotaFonte";
import Pagina from "@/components/Pagina";
import { carregaCeaf, carregaRename } from "@/lib/dados";
import { totalFarmaciaPopular } from "@/lib/farmacia-popular";
import { totalMedicamentosRename } from "@/lib/rename";

/**
 * A home de uma cidade que ainda não tem a lista da prefeitura cadastrada.
 *
 * É a mesma tela da home de uma cidade com lista própria — banner com busca,
 * acesso rápido, informações importantes — com o que existe para esta cidade.
 * Antes era uma página de texto corrido, e quem trocava de cidade tinha a
 * impressão de que o site tinha piorado.
 *
 * O que não temos não aparece: sem as unidades da cidade não há "onde
 * retirar", e sem a lista municipal não há "por tipo de medicamento". Nada de
 * cartão que leva a uma tela vazia.
 */
export default function InicioMunicipioGenerico({
  id,
  nome,
  uf,
}: {
  id: string;
  nome: string;
  uf: string;
}) {
  const rename = carregaRename();
  const medicamentos = totalMedicamentosRename();
  const ceaf = carregaCeaf(uf.toLowerCase());
  const itensPopular = totalFarmaciaPopular();

  if (!rename || medicamentos === 0) {
    return (
      <Pagina municipioId={id} atual="inicio">
        <h1 className="text-[30px] font-bold tracking-tight text-marca md:text-[34px]">
          Tem no SUS em {nome} — {uf}
        </h1>
        <p className="mt-6 max-w-[65ch] leading-normal">
          Ainda não publicamos esta parte.
        </p>
      </Pagina>
    );
  }

  return (
    <Pagina
      municipioId={id}
      atual="inicio"
      topo={
        <section className="banner-sus rounded-2xl border border-[#d3e2f7] bg-[#eaf4fe] bg-[length:auto_100%] bg-[position:right_-2.5rem_center] bg-no-repeat">
          <div className="banner-veu rounded-[15px] px-5 py-6 md:px-6 md:py-7">
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.16em] text-marca-fraca">
              Medicamentos do SUS em {nome}
            </p>
            <h1 className="mt-2 text-[22px] font-bold leading-[1.14] tracking-tight text-marca md:whitespace-nowrap md:text-[30px]">
              Encontre seu medicamento{" "}
              <span className="text-marca-link">no SUS</span>
            </h1>
            <p className="mt-2.5 max-w-[46ch] text-[15px] leading-normal text-[#33506f]">
              Ainda não temos a lista da prefeitura de {nome}. Veja o piso que o
              SUS garante em qualquer cidade do Brasil.
            </p>

            {/*
              Formulário simples, e não o `CampoBusca`: as sugestões enquanto
              se digita vêm de um índice montado da lista municipal, que esta
              cidade não tem. A busca do servidor responde igual.
            */}
            <form
              action={`/${id}/busca`}
              method="get"
              role="search"
              className="mt-5 max-w-[500px]"
            >
              <label htmlFor="q" className="block text-[15px] font-bold text-marca">
                Nome do medicamento
              </label>
              <div className="mt-2 flex flex-wrap gap-3">
                <input
                  id="q"
                  name="q"
                  type="search"
                  autoComplete="off"
                  placeholder="Ex.: losartana, metformina…"
                  className="campo-busca-entrada min-h-[52px] min-w-0 flex-1 basis-[240px] rounded-[10px] border border-marca-linha bg-fundo px-4 text-[16px]"
                />
                <button
                  type="submit"
                  className="min-h-[46px] flex-none self-center rounded-[10px] bg-marca-link px-5 text-[15px] font-semibold text-white hover:bg-marca"
                >
                  Buscar →
                </button>
              </div>
              <p className="mt-2 text-[14px] text-texto-suave">
                Escreva como está na receita ou na caixa.
              </p>
            </form>
          </div>
        </section>
      }
    >
      <section className="pt-10">
        <h2 className="text-[27px] font-bold tracking-tight text-marca">
          Acesso rápido
        </h2>
        <p className="mt-1 text-texto-suave">
          Encontre a informação que você precisa de forma mais rápida.
        </p>
        <div className="mt-6 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(178px,1fr))]">
          <CartaoAcesso
            href={`/${id}/remedios`}
            cor="#1351b4"
            icone="A-Z"
            titulo="Lista de medicamentos A–Z"
          >
            Os {medicamentos} medicamentos que o SUS garante em qualquer cidade
            do Brasil, em ordem alfabética.
          </CartaoAcesso>

          {ceaf && (
            <CartaoAcesso
              href={`/${id}/alto-custo`}
              cor="#b45309"
              icone={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M6 3h9l4 4v14H6V3Z" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
                  <path d="M9 12h7M9 16h5" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                </svg>
              }
              titulo="Medicamento de alto custo"
            >
              Quem entrega é o governo do estado, não o posto. Veja como abrir o
              pedido.
            </CartaoAcesso>
          )}

          {itensPopular > 0 && (
            <CartaoAcesso
              href={`/${id}/farmacia-popular`}
              cor="#7c4dcc"
              icone={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="6" width="18" height="14" rx="2.5" fill="#fff" />
                  <path d="M12 9.5v7M8.5 13h7" stroke="#7c4dcc" strokeWidth="2" strokeLinecap="round" />
                </svg>
              }
              titulo="Farmácia Popular"
            >
              Os {itensPopular} itens que saem de graça na farmácia da rua
              credenciada.
            </CartaoAcesso>
          )}
        </div>
      </section>

      <section className="pt-10">
        <h2 className="text-[27px] font-bold tracking-tight text-marca">
          Informações importantes
        </h2>
        <p className="mt-1 text-texto-suave">
          Como funciona o acesso aos medicamentos do SUS.
        </p>
        <div className="mt-6 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(250px,1fr))]">
          {/*
            Este cartão substitui o "Onde encontrar" da cidade com lista
            própria: sem as unidades da cidade cadastradas, o site diz que não
            sabe e encaminha, em vez de inventar endereço.
          */}
          <CartaoInfo
            titulo={`Onde retirar em ${nome}`}
            texto={`Ainda não temos as unidades de saúde de ${nome}. Pergunte na UBS mais próxima ou ligue para a Secretaria de Saúde do município.`}
            href={`/${id}/sobre`}
            chamada="Como ajudar a cadastrar"
            icone={
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                <path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z" fill="#8aa4c4" />
                <circle cx="12" cy="10" r="2.6" fill="#eef3fa" />
              </svg>
            }
          />

          {ceaf && (
            <CartaoInfo
              titulo="Medicamento de alto custo"
              texto="Quem entrega é o governo do estado, não o posto. Entenda como abrir o pedido e quais papéis levar."
              href={`/${id}/alto-custo`}
              chamada="Saiba mais"
              fundo="#fdf0dc"
              icone={
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                  <path d="m12 3.5 2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.8l6-.8L12 3.5Z" fill="#f0a92b" />
                </svg>
              }
            />
          )}

          {itensPopular > 0 && (
            <CartaoInfo
              titulo="Farmácia Popular"
              texto={`${itensPopular} itens saem de graça na farmácia da rua credenciada, com receita e documento com CPF. É programa federal, fora do posto.`}
              href={`/${id}/farmacia-popular`}
              chamada="Ver o que tem"
              fundo="#f3edfd"
              icone={
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="6" width="18" height="14" rx="2.5" fill="#7c4dcc" />
                  <path d="M12 9.5v7M8.5 13h7" stroke="#f3edfd" strokeWidth="2" strokeLinecap="round" />
                  <path d="M9 6V4.5h6V6" stroke="#7c4dcc" strokeWidth="2" strokeLinecap="round" />
                </svg>
              }
            />
          )}

          <CartaoInfo
            titulo="De onde vêm os dados"
            texto="Cada informação vem de um documento público, e a página mostra qual é e quando foi conferida."
            href={`/${id}/sobre`}
            chamada="Sobre o site"
            icone={
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" fill="#1351b4" />
                <path d="M12 10.5v6" stroke="#e7f0fd" strokeWidth="2" strokeLinecap="round" />
                <circle cx="12" cy="7.6" r="1.2" fill="#e7f0fd" />
              </svg>
            }
          />
        </div>
      </section>

      <NotaFonte proveniencia={rename.proveniencia} telefone={null} />
    </Pagina>
  );
}
