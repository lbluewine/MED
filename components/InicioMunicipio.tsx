import CampoBusca from "@/components/CampoBusca";
import CartaoAcesso from "@/components/CartaoAcesso";
import CartaoInfo from "@/components/CartaoInfo";
import Pagina from "@/components/Pagina";
import { carregaUnidades } from "@/lib/dados";
import { listaClasses } from "@/lib/classes";
import { totalFarmaciaPopular } from "@/lib/farmacia-popular";
import { listaRemedios } from "@/lib/remedios";
import { indiceSerializado } from "@/lib/indice";
import type { Municipio } from "@/lib/schema";

/**
 * A home de uma cidade com REMUME publicada: busca, acesso rápido e os
 * caminhos principais. Usada tanto em `/` (enquanto houver uma cidade só)
 * quanto em `/[municipio]` (quando houver mais de uma).
 */
export default function InicioMunicipio({
  id,
  municipio,
}: {
  id: string;
  municipio: Municipio;
}) {
  return (
    <Pagina
      municipioId={id}
      atual="inicio"
      topo={
        /*
          A arte entra como fundo, não como <img> ao lado: assim ela ocupa a
          faixa inteira e o texto pode andar por cima da parte lisa da
          esquerda, em vez de disputar metade do espaço com ela.

          O véu por cima é um degradê que vai de quase opaco na esquerda a
          transparente na direita. É ele que garante o contraste do texto
          quando a tela é estreita e a arte chega perto das letras.

          A logomarca do SUS aparece aqui com autorização do mantenedor,
          registrada em docs/STACK.md.
        */
        <section className="banner-sus rounded-2xl border border-[#d3e2f7] bg-[#eaf4fe] bg-[length:auto_100%] bg-[position:right_-2.5rem_center] bg-no-repeat">
          {/*
            O canto arredondado é do véu também, e não do corte do pai: sem
            `overflow-hidden` a lista de sugestões pode passar da borda de baixo
            do banner. 15px = os 16px do pai menos a borda de 1px, para não
            sobrar um fio de fundo no canto.
          */}
          <div className="banner-veu rounded-[15px] px-5 py-6 md:px-6 md:py-7">
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.16em] text-marca-fraca">
              Medicamentos do SUS em {municipio.nome}
            </p>
            {/*
              Uma linha só a partir de 768px, onde a frase cabe. Em tela
              estreita ela quebra: forçar `nowrap` em 360px joga "no SUS"
              para fora da tela, e o título é a primeira coisa que a pessoa lê.
            */}
            <h1 className="mt-2 text-[22px] font-bold leading-[1.14] tracking-tight text-marca md:whitespace-nowrap md:text-[30px]">
              Encontre seu medicamento{" "}
              <span className="text-marca-link">no SUS</span>
            </h1>
            <p className="mt-2.5 max-w-[40ch] text-[15px] leading-normal text-[#33506f]">
              Veja se o SUS de {municipio.nome} fornece o medicamento que você
              precisa, onde retirar e o que levar.
            </p>

            <div className="mt-5 max-w-[500px]">
              <CampoBusca municipioId={id} indice={indiceSerializado(id)} />
            </div>
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
            Todos os {listaRemedios(id).length} medicamentos da lista, em ordem
            alfabética.
          </CartaoAcesso>

          <CartaoAcesso
            href={`/${id}/remedios/tipos`}
            cor="#1a8b5f"
            icone={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M9 7h11M9 12h11M9 17h11" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                <circle cx="5" cy="7" r="1.6" fill="#fff" />
                <circle cx="5" cy="12" r="1.6" fill="#fff" />
                <circle cx="5" cy="17" r="1.6" fill="#fff" />
              </svg>
            }
            titulo="Buscar por tipo"
          >
            Os {listaClasses(id).length} grupos em que a própria lista separa os
            medicamentos.
          </CartaoAcesso>

          <CartaoAcesso
            href={`/${id}/onde-pegar`}
            cor="#d64545"
            icone={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z" fill="#fff" />
                <circle cx="12" cy="10" r="2.6" fill="#d64545" />
              </svg>
            }
            titulo="Ver onde retirar"
          >
            As {carregaUnidades(id).length} unidades da cidade, com endereço,
            telefone e o que cada uma entrega.
          </CartaoAcesso>

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
        </div>
      </section>

      <section className="pt-10">
        <h2 className="text-[27px] font-bold tracking-tight text-marca">
          Informações importantes
        </h2>
        <p className="mt-1 text-texto-suave">
          Como funciona o acesso aos medicamentos do SUS na cidade.
        </p>
        <div className="mt-6 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(250px,1fr))]">
          <CartaoInfo
            titulo="O que levar"
            texto="A receita original, documento com foto e cadastro na sua unidade. Cada medicamento pode pedir um tipo de receita."
            href={`/${id}/remedios`}
            chamada="Ver medicamentos"
            icone={
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                <path d="M6 3h8l4 4v14H6V3Z" fill="#1351b4" />
                <path d="M9 12h6M9 16h6" stroke="#e7f0fd" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            }
          />
          <CartaoInfo
            titulo="Onde encontrar"
            texto={`As ${carregaUnidades(id).length} unidades de ${municipio.nome}, com endereço, telefone e o que cada uma entrega.`}
            href={`/${id}/onde-pegar`}
            chamada="Ver unidades"
            icone={
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                <path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z" fill="#1351b4" />
                <circle cx="12" cy="10" r="2.6" fill="#e7f0fd" />
              </svg>
            }
          />
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
          <CartaoInfo
            titulo="Farmácia Popular"
            texto={`${totalFarmaciaPopular()} itens saem de graça na farmácia da rua credenciada, com receita e documento com CPF. É programa federal, fora do posto.`}
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
    </Pagina>
  );
}
