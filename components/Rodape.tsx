import { AVISO_INDEPENDENTE } from "@/lib/textos";

/** Vai em toda página. O aviso de projeto independente não é opcional. */
export default function Rodape() {
  return (
    <footer className="mt-16 border-t border-linha">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-[13.5px] leading-normal text-texto-suave">
          {AVISO_INDEPENDENTE}
        </p>
        <p className="mt-3 text-[13.5px]">
          <a className="underline" href="/sobre">
            Quem faz, de onde vêm os dados e como corrigir um erro
          </a>
        </p>
      </div>
    </footer>
  );
}
