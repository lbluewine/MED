import { listaMunicipios } from "@/lib/dados";
import { SEM_DADO_AINDA } from "@/lib/textos";

export default function Home() {
  const municipios = listaMunicipios();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-[30px] font-bold leading-tight">Tem no SUS?</h1>
      <p className="mt-4 max-w-[65ch]">
        Digite o nome do remédio da sua receita. A gente responde se ele tem no
        SUS, onde retirar e o que levar.
      </p>

      {municipios.length === 0 ? (
        <p className="mt-8 max-w-[65ch] border-l-4 border-processo pl-4">
          {SEM_DADO_AINDA}
        </p>
      ) : (
        <ul className="mt-8">
          {municipios.map((id) => (
            <li key={id}>{id}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
