import Botao from "@/components/Botao";
import Cabecalho from "@/components/Cabecalho";
import CampoBusca from "@/components/CampoBusca";
import { carregaMunicipio, listaMunicipios } from "@/lib/dados";
import { indiceSerializado } from "@/lib/indice";
import { SEM_DADO_AINDA } from "@/lib/textos";

export default function Home() {
  const municipios = listaMunicipios();

  if (municipios.length === 0) {
    return (
      <div>
        <Cabecalho />
        <div className="mx-auto max-w-2xl px-4 py-10 md:px-12 md:py-16">
          <h1 className="text-[30px] font-bold leading-tight md:text-[38px]">
            Tem no SUS?
          </h1>
          <p className="mt-8 max-w-[65ch] border-l-4 border-processo pl-4">
            {SEM_DADO_AINDA}
          </p>
        </div>
      </div>
    );
  }

  // Enquanto houver uma cidade só, a home já é a busca dela. Com mais de uma,
  // a pessoa escolhe primeiro.
  if (municipios.length > 1) {
    return (
      <div>
        <Cabecalho />
        <div className="mx-auto max-w-2xl px-4 py-10 md:px-12 md:py-16">
          <h1 className="text-[30px] font-bold leading-tight md:text-[38px]">
            Tem no SUS?
          </h1>
          <p className="mt-4 max-w-[65ch]">Escolha a sua cidade.</p>
          <ul className="mt-6">
            {municipios.map((id) => {
              const m = carregaMunicipio(id);
              return (
                <li key={id} className="border-b border-linha">
                  <a
                    href={`/${id}`}
                    className="block min-h-[48px] py-3 text-[20px] underline"
                  >
                    {m.nome} ({m.uf})
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  }

  const id = municipios[0]!;
  const municipio = carregaMunicipio(id);

  return (
    <div>
      <Cabecalho municipioId={id} />
      <div className="mx-auto max-w-2xl px-4 py-10 md:max-w-3xl md:px-12 md:py-16">
        <h1 className="text-[30px] font-bold leading-tight tracking-tight md:text-[38px]">
          Qual remédio você está procurando?
        </h1>
        <p className="mt-4 max-w-[36em] text-texto-suave">
          Veja se o SUS de {municipio.nome} entrega esse remédio de graça, onde
          retirar e o que levar. Digite o nome que está na receita.
        </p>

        <div className="mt-8">
          <CampoBusca municipioId={id} indice={indiceSerializado(id)} />
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-linha pt-8 md:flex-row">
          <Botao variante="secundario" href={`/${id}/onde-pegar`} className="w-full md:w-auto">
            Ver onde pegar remédio
          </Botao>
          <Botao variante="secundario" href="/alto-custo" className="w-full md:w-auto">
            Remédio de alto custo: como pedir
          </Botao>
          <Botao variante="secundario" href={`/${id}/remedios`} className="w-full md:w-auto">
            Lista completa, de A a Z
          </Botao>
        </div>
      </div>
    </div>
  );
}
