# ROADMAP.md

Regra: **não construa nada de v1 antes de v0 estar no ar e correto.** Um site
pequeno e certo vale mais que um grande e desatualizado.

## v0 — só Criciúma, sem conteúdo clínico

O objetivo é provar que o dado se mantém atualizado antes de crescer.

- [x] Schema Zod e carregamento validado do `data/`
- [x] `remume.json` de Criciúma extraído da REMUME publicada, com proveniência
- [x] `unidades.json` com endereço, telefone, horário, o que dispensa e
      restrição de público
- [x] Busca "Tem no SUS?" com tolerância a acento e erro de digitação
- [x] Página de resultado: tem / não tem, componente, onde retirar, o que levar
- [x] "Onde pegar": lista + mapa Leaflet, com alternativa em lista sem JS
- [x] Guia do CEAF em SC, passo a passo, com checklist imprimível
- [ ] Página "Sobre": quem faz, de onde vêm os dados, como corrigir um erro
      — no ar, menos dois TODO: falta o canal para relatar erro e os nomes
      de quem faz, que dependem de autorização de cada pessoa
- [x] Aviso de projeto independente no rodapé de toda página
- [x] Data de verificação visível em toda página com dado
- [x] Job semanal que confere as fontes e abre PR quando mudam

Construído depois, sem estar na lista original:

- [x] Navegação por tipo de medicamento, do jeito que a própria lista
      classifica (92 grupos)
- [x] Banner, menu lateral no desktop e paleta de cor
- [x] Distância até a unidade a partir da localização da pessoa, sob permissão
- [x] Busca pelo nome comercial (fonte ainda informada pelo mantenedor, não
      conferida na Anvisa — ver `data/fontes/FONTES.md`)

**Fora do v0:** conteúdo clínico, preço, chat, outros municípios.

### Critério para dizer que v0 acabou

Três pessoas de 60+ anos, sem ajuda, conseguem descobrir se um medicamento da
receita delas tem no SUS e para onde ir. Se não conseguirem, o v0 não acabou.

**Isso ainda não foi testado com ninguém.** Enquanto não for, o v0 não está
fechado — por mais que a lista acima esteja quase toda marcada.

## v1 — conteúdo revisado e preço

- [ ] Ficha editorial por medicamento (como tomar, esquecimento, guardar,
      efeitos comuns, quando procurar ajuda)
- [ ] Fluxo de revisão farmacêutica: autorização por escrito, bloco de revisão
      por página, aviso de revisão vencida aos 18 meses
- [ ] Preço máximo CMED com atualização mensal automatizada (PR, não merge)
- [ ] Marcação de quais itens estão na Farmácia Popular
- [ ] "Minha lista": montar a lista de medicamentos e gerar PDF para levar ao
      farmacêutico da UBS
- [ ] Link para a bula do paciente na Anvisa em cada ficha

## v2 — mais municípios

- [ ] Seletor de município e rotas por município já funcionando de ponta a ponta
- [ ] Guia de contribuição explicando como adicionar uma cidade
- [ ] Segundo município como prova real do modelo (Içara ou Forquilhinha)
- [ ] Aviso claro de residência: cada município atende os próprios moradores.
      Nunca mandar alguém para outra cidade sem esse aviso
- [ ] "O que a lista daqui tem para essa condição" — sem linguagem de indicação

## v3 — chat

Só depois de v0 a v2 estáveis. Arquitetura obrigatória:

- A IA **não gera fatos.** Ela interpreta a pergunta e escolhe uma consulta ao
  banco de dados. A resposta sai de um template preenchido com o dado.
- Fora dos casos previstos, resposta fixa de recusa com encaminhamento ao
  farmacêutico da unidade mais próxima.
- Perguntas que o chat responde: tem no SUS aqui, onde retirar, o que levar,
  qual o horário, como pedir alto custo, quanto custa na farmácia.
- Perguntas que o chat recusa sempre: posso tomar junto com, posso parar, a dose
  está certa, isso serve para a minha doença, estou sentindo X.
- Sem histórico de conversa armazenado no servidor.

O escopo pretendido é bom. O risco não é o escopo — é que o usuário não o
conhece e vai perguntar coisa clínica de qualquer jeito. A recusa precisa ser
estrutural, não uma instrução no prompt.

## Ideias guardadas (não construir sem discutir)

- Relato colaborativo de falta ("faltou hoje nessa unidade"). É o dado mais
  valioso que ninguém oferece e o mais fácil de virar ruído ou boato.
- Integração de estoque real com a Secretaria Municipal de Saúde.
- Aplicativo. Um PWA bem-feito resolve, e app na loja é manutenção que projeto
  voluntário não sustenta.
- Notificação de desabastecimento do CEAF a partir das notas técnicas da SES/SC.
