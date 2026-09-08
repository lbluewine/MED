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
      — no ar. O canal de relato entrou em 08/09/2026: issue no repositório com
      título e corpo preenchidos, três tipos (erro na tela, link quebrado, onde
      está a REMUME de um município). Falta ainda os nomes de quem faz, que
      dependem de autorização de cada pessoa.

      O canal exige conta no GitHub e a tela diz isso. Não serve para o público
      principal do site, e é dívida registrada em `docs/CONTEUDO.md`, não
      esquecimento.
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
- [x] Marcação de quais itens estão na Farmácia Popular — construído em
      06/09/2026 por decisão do mantenedor, antes de o v0 fechar. Elenco
      federal completo, cruzamento com a lista municipal e página própria; a
      rede de farmácias credenciadas continua sendo consulta ao painel oficial
- [ ] "Minha lista": montar a lista de medicamentos e gerar PDF para levar ao
      farmacêutico da UBS
- [ ] Link para a bula do paciente na Anvisa em cada ficha

## v2 — mais municípios

- [x] Seletor de cidade e rotas por município funcionando de ponta a ponta,
      para qualquer um dos 5.570 municípios do Brasil — construído em
      07/09/2026 por decisão do mantenedor, antes de o v0 fechar. Cidade sem
      REMUME própria cai no piso nacional da RENAME
      (`data/nacional/rename.json`), nunca em endereço ou unidade inventados.
      Ver `docs/DADOS.md`.
- [x] RENAME publicada — 966 apresentações de 534 medicamentos da RENAME 2024,
      extraídas em 07/09/2026 por `scripts/extrai_rename.py`. Toda cidade do
      Brasil passa a ter resposta, no lugar de "ainda não publicamos esta
      parte".

      `bvsms.saude.gov.br`, que é a fonte canônica, continua com a conexão
      fechada nesta rede; o script tenta essa primeiro e cai na cópia que a
      SES/SC publica, registrando na proveniência qual das duas usou.

      A extração lê a cor de fundo da tabela, não só o texto: o nome de um
      medicamento com várias apresentações fica solto numa célula mesclada, e
      associá-lo por proximidade dava apresentação trocada — dizia que
      imiquimode é suspensão oral (é creme) e que naloxona é cápsula (é
      solução injetável). A faixa de fundo é a única marca no PDF que delimita
      a célula. Conferido: os 534 nomes batem um a um com os três anexos.
- [x] Prospecção de REMUME no Querido Diário — `scripts/prospecta_remume.py`
      varre o acervo dos ~950 municípios raspados atrás do ato que aprova a
      lista municipal, separa o que parece ato do que parece edital de compra e
      grava a fila de leitura em `data/fontes/prospeccao/`. Ordenada por
      população, com `scripts/baixa_populacao_ibge.py` (Censo 2022).

      Primeira varredura, nos 60 maiores municípios: 13 com ato provável, 11
      só com portaria da Comissão de Farmácia e Terapêutica, 13 com acervo sem
      texto para pesquisar. Conferidos à mão, 9 dos 13 são o ato de verdade —
      Cuiabá, Campo Grande, Niterói, Campos dos Goytacazes, Rio de Janeiro,
      Joinville, Jaboatão, Belém e Betim.

      Três coisas que a construção mostrou. A busca vem do diário mais novo
      para o mais velho e o decreto que aprovou a lista costuma ser antigo,
      atrás de dezenas de editais de compra — em Florianópolis são 119 citações
      à REMUME e nenhuma é o ato. Daí a segunda passada paginada.

      A maior armadilha é a portaria que cria a Comissão de Farmácia e
      Terapêutica: ela lista "atualizar a REMUME" entre as atribuições e, na
      primeira versão da triagem, 22 dos 24 "atos" eram isso. Virou classe
      própria, com teste de regressão em `scripts/testa_prospeccao.py`.

      E parte dos acervos raspados não tem texto para pesquisar, devolvendo
      zero para qualquer palavra. O relatório sonda com "prefeitura" e separa
      "não cita a REMUME" de "não dá para saber", porque juntar os dois seria
      afirmar sobre a cidade algo que não se apurou. O nível de abertura do
      Querido Diário não serve para essa separação: São Paulo é nível 1 e
      responde, Blumenau é nível 1 e não.

      Não publica nada: a triagem de qual documento é a lista vigente continua
      humana, e nenhum dado de saúde entra no `data/` por esse caminho.
      Ver `docs/DADOS.md`.
- [x] Console de manutenção em `/dev` — o que está pendente, com o comando de
      cada coisa, e os números do que está publicado. Fora do menu e com
      `noindex`. Não executa nada: site estático não tem servidor para receber
      ação, e publicar dado continua sendo por pull request. Ver `docs/LAYOUT.md`.
- [ ] Triar a fila da prospecção e escolher as primeiras cidades a importar
- [x] Rede de unidades de saúde pelo CNES — `scripts/baixa_cnes.py` e
      `scripts/extrai_unidades_cnes.py` trazem do cadastro federal, para
      qualquer município do Brasil e no mesmo formato, nome, endereço,
      telefone, coordenada, turno e tipo de cada estabelecimento.

      Muda o plano de expansão: endereço de posto de saúde não precisa de
      catálogo de sites de prefeitura, precisa de uma fonte só. O catálogo por
      município fica reservado à REMUME, onde ele é insubstituível.

      Arquivo separado de `unidades.json` de propósito, pelo mesmo motivo das
      farmácias do PFPB: o CNES não sabe o que cada unidade entrega nem que
      receita ela exige, e juntar os dois faria o site afirmar isso a partir da
      mera existência da unidade.
- [x] Página pública de estado das fontes (`/fontes`) — o que foi conferido
      quando, o que mudou e o que não respondeu. Sem login e sem servidor: o
      job semanal escreve `data/fontes/estado.json` e o build gera a página.

      Pública de propósito: é assim que alguém de fora descobre que a
      prefeitura mudou o endereço de um documento e avisa onde ele está.
      Painel com autenticação briga com o `CLAUDE.md`, seção 6 — e não haveria
      o que administrar ali, só o que já aconteceu para ler.
- [x] Catálogo de sites oficiais de prefeitura e cascata de busca da REMUME —
      `scripts/monta_catalogo_prefeituras.py` descobre o domínio pelo padrão
      `cidade.uf.gov.br` e o confirma pelo título da página (82% de acerto nos
      60 maiores), e `scripts/acha_remume.py` roda a cascata: link direto,
      listagem com regra, Querido Diário, LAI.

      Conferido de ponta a ponta em Criciúma: a cascata baixou o PDF e o
      SHA-256 bateu com a cópia guardada no repositório. Com o link trocado por
      um inexistente, a situação virou `mudou_de_lugar` e o aviso apareceu na
      página `/fontes` — que é o ciclo que faltava fechar.

      A busca no buscador (`site:dominio REMUME filetype:pdf`) ficou de fora:
      depende de chave de API que o projeto não tem. Registrado como degrau
      ausente, não como degrau que existe.
- [ ] Guia de contribuição explicando como adicionar uma cidade
- [ ] Segundo município com REMUME própria — **em andamento, Campo Grande/MS**.

      A prospecção achou 13 candidatos a ato; conferindo o texto de cada
      diário, só 6 trazem a lista de fato. O ato mais recente, de Campos dos
      Goytacazes (junho de 2026), **não** traz: aprova um anexo publicado em
      outro lugar. Campo Grande é a maior lista completa: 334 itens, Resolução
      SESAU 628/2021.

      Lido e conferido: `scripts/le_remume_campo_grande.py` extrai o Anexo I do
      diário por coordenadas, e a numeração da própria fonte confirma a leitura
      — 334 itens, de 1 a 334, nenhum faltando, nenhum repetido, nenhuma célula
      vazia. Sai em `data/fontes/ms-campo-grande/anexo-i-lido.json`, com 5 itens
      apontados para conferência humana.

      **Não está publicado, e falta o que impede publicar:**

      1. `unidades.json` — a lista diz "CEM", "CEDIP", "CRS", "APS", e o site
         não sabe onde ficam. Sem endereço, não dá para dizer onde retirar. O
         CNES tem esses estabelecimentos; falta casar um com o outro.
      2. Vocabulário de unidade — `TipoUnidade` foi escrito com os tipos de
         Criciúma. CEM, CEDIP, CTA e CRS não existem lá, e forçar encaixe
         mandaria alguém ao lugar errado.
      3. `exigencias_gerais` — a resolução não diz o que a pessoa leva.
      4. Conferir a versão — a lista é de 2021. Antes de publicar, alguém
         precisa confirmar que ainda é a vigente.

      Anexos II e III ficam **de fora por decisão, não por esquecimento**: a
      própria resolução diz que o II é "de uso em procedimentos internos, não
      dispensados à população", e o III é o que fica na UPA durante o
      atendimento. Publicá-los mandaria alguém à farmácia buscar o que nunca é
      entregue.
- [ ] Aviso claro de residência: cada município atende os próprios moradores.
      Nunca mandar alguém para outra cidade sem esse aviso
- [ ] "O que a lista daqui tem para essa condição" — sem linguagem de indicação
- [ ] Sugestão de cidade por geolocalização de IP — depende de serviço de
      terceiro, precisa de autorização explícita antes de começar (ver
      `CLAUDE.md`, seção 6). Se algum dia entrar, é sugestão com confirmação
      explícita ("é essa sua cidade?"), nunca pré-seleção silenciosa: IP erra
      cidade com frequência, principalmente em rede móvel.

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
