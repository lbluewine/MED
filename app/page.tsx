import CampoBusca from "@/components/CampoBusca";
import { carregaMunicipio, listaMunicipios } from "@/lib/dados";
import { indiceSerializado } from "@/lib/indice";
import { SEM_DADO_AINDA } from "@/lib/textos";

export default function Home() {
  const municipios = listaMunicipios();

  if (municipios.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-[30px] font-bold leading-tight">Tem no SUS?</h1>
        <p className="mt-8 max-w-[65ch] border-l-4 border-processo pl-4">
          {SEM_DADO_AINDA}
        </p>
      </div>
    );
  }

  // Enquanto houver uma cidade só, a home já é a busca dela. Com mais de uma,
  // a pessoa escolhe primeiro.
  if (municipios.length > 1) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-[30px] font-bold leading-tight">Tem no SUS?</h1>
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
    );
  }

  const id = municipios[0]!;
  const municipio = carregaMunicipio(id);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-[30px] font-bold leading-tight">Tem no SUS?</h1>
      <p className="mt-4 max-w-[65ch]">
        Veja se o remédio da sua receita tem no SUS em {municipio.nome}, onde
        retirar e o que levar.
      </p>

      <div className="mt-8">
        <CampoBusca municipioId={id} indice={indiceSerializado(id)} />
      </div>

      <ul className="mt-8">
        <li className="border-t border-linha">
          <a
            className="block min-h-[48px] py-3 text-[20px] underline"
            href={`/${id}/onde-pegar`}
          >
            Ver onde pegar remédio em {municipio.nome}
          </a>
        </li>
        <li className="border-t border-linha">
          <a
            className="block min-h-[48px] py-3 text-[20px] underline"
            href={`/${id}/remedios`}
          >
            Ver a lista completa de remédios, de A a Z
          </a>
        </li>
      </ul>
    </div>
  );
}
