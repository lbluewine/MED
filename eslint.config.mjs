import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

export default [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      /*
       * O site usa <a> comum, não <Link>.
       *
       * <Link> traz roteamento no cliente e prefetch. Prefetch baixa páginas
       * que a pessoa talvez nem abra, e o público daqui está em celular
       * simples com internet cara. Além disso, as páginas de conteúdo têm que
       * funcionar com o JavaScript desligado, e <a> já faz isso sem nada.
       *
       * Ver docs/STACK.md.
       */
      "@next/next/no-html-link-for-pages": "off",
    },
  },
  { ignores: [".next/**", "node_modules/**"] },
];
