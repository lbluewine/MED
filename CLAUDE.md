# CLAUDE.md

Instruções para o Claude Code neste repositório. Leia este arquivo inteiro antes
de qualquer tarefa.

Nome provisório do projeto: **Tem no SUS**
Repositório: `tem-no-sus`

---

## 1. Como você deve se comunicar

- **Responda sempre em português do Brasil.**
- **Seja direto e curto.** Sem preâmbulo, sem resumo do que acabou de fazer, sem
  elogiar a pergunta. Vá direto ao ponto.
- Não repita o código que acabou de escrever dentro da resposta em texto.
- Se a tarefa foi feita, diga o que mudou em 1–3 linhas e pare.
- Se tiver dúvida sobre o que fazer, **pergunte antes de codar**. Uma pergunta
  curta custa menos que uma refatoração.
- Se discordar de uma instrução, diga em uma frase e explique o porquê. Não
  execute em silêncio algo que você acha errado.

## 2. As três regras que nunca se quebram

Este é um site de saúde pública. Errar aqui machuca gente de verdade.

1. **Nunca invente dado de saúde.** Nenhum medicamento, dose, endereço, horário,
   telefone ou preço pode aparecer no site sem vir de um arquivo de dados com
   fonte declarada. Se o dado não existe, o site diz que não sabe.
2. **Nunca gere texto clínico sem revisão.** Todo conteúdo sobre uso de
   medicamento precisa de revisão farmacêutica registrada. Veja
   `docs/CONTEUDO.md`.
3. **Nunca publique atualização automática.** Robô e IA propõem mudança; humano
   aprova. Veja `docs/DADOS.md`.

## 3. Contexto essencial em uma frase

O site traduz para linguagem simples **o que o SUS fornece em Criciúma/SC, onde
retirar e como conseguir** — com foco especial no processo do CEAF (alto custo),
que é onde as pessoas mais se perdem.

O público é: pessoa idosa, com pouca familiaridade digital, celular barato,
internet ruim, muitas vezes lendo no sol. Toda decisão de produto se resolve
perguntando "isso ajuda essa pessoa?".

## 4. Documentação — leia o que for relevante à tarefa

| Arquivo | Quando ler |
|---|---|
| `docs/PROJETO.md` | Antes de qualquer decisão de escopo ou funcionalidade nova |
| `docs/CONTEUDO.md` | Ao escrever ou alterar qualquer texto que o usuário lê |
| `docs/DADOS.md` | Ao mexer em arquivos de dados, schema ou pipeline de atualização |
| `docs/STACK.md` | Ao escrever código, componentes ou estilos |
| `docs/ROADMAP.md` | Para saber o que é v0 e o que não deve ser construído ainda |
| `docs/FUNCIONALIDADES.md` | Para saber o que o site já faz, antes de propor algo que já existe |

Não leia todos por padrão. Leia o necessário.

## 5. Antes de dar uma tarefa por concluída

- [ ] Passa no `npm run build` sem erro nem warning novo
- [ ] Todo dado novo tem `fonte` e `verificado_em` preenchidos
- [ ] Nenhum texto clínico novo foi publicado sem `revisao` preenchida
- [ ] Funciona com teclado e tem foco visível
- [ ] Testado mentalmente em tela de 360px de largura

## 6. Coisas que você não deve fazer sem pedir autorização

- Adicionar dependência nova ao `package.json`
- Criar qualquer forma de login, conta ou cookie que identifique pessoa
- Adicionar analytics, pixel, ou qualquer script de terceiro
- Construir funcionalidade marcada como v2/v3 no `docs/ROADMAP.md`
- Usar a identidade visual oficial do SUS, do Ministério da Saúde ou da
  Prefeitura de Criciúma
