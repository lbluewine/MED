import Dev from "@/components/Dev";

export const metadata = {
  title: "Console de manutenção — Tem no SUS?",
  // Não é secreta — site estático não tem como esconder —, mas também não é
  // para quem procura remédio. Fora do índice e sem link em página nenhuma.
  robots: { index: false, follow: false },
};

export default function PaginaDev() {
  return <Dev />;
}
