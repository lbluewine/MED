import FarmaciasPopularesCidade from "@/components/FarmaciasPopularesCidade";

export const metadata = {
  title: "Onde tem Farmácia Popular — Tem no SUS?",
};

/**
 * Sem cidade escolhida: a página diz que não sabe quais drogarias mostrar e
 * manda ao painel oficial, em vez de servir as de um município qualquer.
 */
export default function PaginaFarmaciasPFPB() {
  return <FarmaciasPopularesCidade />;
}
