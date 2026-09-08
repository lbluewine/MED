import InicioMunicipio from "@/components/InicioMunicipio";
import Pagina from "@/components/Pagina";
import {
  carregaCadastroMunicipiosIbge,
  carregaMunicipio,
  listaMunicipios,
} from "@/lib/dados";
import { SEM_DADO_AINDA } from "@/lib/textos";

export default function Home() {
  const municipios = listaMunicipios();

  if (municipios.length === 0) {
    return (
      <Pagina atual="inicio">
        <h1 className="text-[30px] font-bold leading-tight md:text-[38px]">
          Tem no SUS?
        </h1>
        <p className="mt-8 max-w-[65ch] border-l-4 border-processo pl-4">
          {SEM_DADO_AINDA}
        </p>
      </Pagina>
    );
  }

  // Enquanto houver uma cidade só, a home já é a busca dela. Com mais de uma,
  // a pessoa escolhe primeiro.
  if (municipios.length > 1) {
    const cadastro = carregaCadastroMunicipiosIbge();
    return (
      <Pagina atual="inicio">
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

        {cadastro && (
          <div className="mt-8 max-w-[520px] border-t border-linha pt-6">
            <p className="text-texto-suave">
              Sua cidade não está na lista acima? Ainda assim o SUS garante um
              piso de medicamentos em qualquer município do Brasil.
            </p>
            <a
              href="/cidades"
              className="mt-3 inline-flex min-h-[48px] items-center rounded-[10px] bg-marca px-5 text-[16px] font-semibold text-white no-underline hover:bg-marca-link"
            >
              Procurar minha cidade
            </a>
          </div>
        )}
      </Pagina>
    );
  }

  const id = municipios[0]!;
  const municipio = carregaMunicipio(id);
  return <InicioMunicipio id={id} municipio={municipio} />;
}
