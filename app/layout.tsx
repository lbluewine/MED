import type { Metadata, Viewport } from "next";
import Rodape from "@/components/Rodape";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tem no SUS?",
  description:
    "Descubra se o seu medicamento tem no SUS em Criciúma, onde retirar e o que levar.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="flex min-h-screen flex-col">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:block focus:p-4 focus:underline"
        >
          Pular para o conteúdo
        </a>
        <main id="conteudo" className="flex-1">
          {children}
        </main>
        <Rodape />
      </body>
    </html>
  );
}
