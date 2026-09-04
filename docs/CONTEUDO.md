# CONTEUDO.md — regras de escrita e revisão

Leia antes de escrever qualquer texto que o usuário lê, inclusive rótulo de
botão, mensagem de erro e tela vazia.

## Tom de voz

- Frases curtas. Uma ideia por frase.
- Voz ativa. "Leve a receita", não "a receita deverá ser apresentada".
- Trate por "você".
- Nível de leitura alvo: alguém que estudou até o 6º ano.
- Sem emoji no conteúdo. Sem exclamação.
- Nunca culpe o usuário. Nunca use tom institucional de aviso.

### Tradução obrigatória de jargão

Sempre que o termo técnico precisar aparecer, explique na mesma frase:

| Não escreva sozinho | Escreva |
|---|---|
| REMUME | a lista de remédios que a prefeitura de Criciúma entrega (REMUME) |
| CEAF | os remédios de alto custo, que quem entrega é o governo do estado (CEAF) |
| LME | o laudo que o médico preenche para pedir o remédio (LME) |
| PCDT | as regras do Ministério da Saúde para cada doença (PCDT) |
| dispensação | entrega |
| posologia | como tomar |
| via oral | pela boca |
| adesão ao tratamento | tomar o remédio direito |

## O que pode e o que não pode ser escrito

### Pode, com revisão farmacêutica

- Como tomar: com ou sem comida, com água, inteiro ou partido.
- O que fazer se esquecer uma dose.
- Como guardar (geladeira, longe do sol, longe de criança).
- O que costuma acontecer nos primeiros dias e o que não é motivo de susto.
- Quando procurar ajuda com urgência.

### Nunca, em nenhuma versão

- **Interações medicamentosas.** Ver não-objetivos em `docs/PROJETO.md`.
- Indicar, sugerir ou desaconselhar um tratamento.
- Dizer que um remédio "é melhor" ou "substitui" outro.
- Sugerir dose, mudança de dose ou parada de tratamento.
- Diagnóstico, mesmo por eliminação.

### Como falar de alternativa sem prescrever

É legítimo e útil informar que existe outra opção **na lista do município** para
a mesma condição — desde que a decisão continue com o médico:

> Esse remédio não está na lista de Criciúma. Para essa mesma condição, a lista
> do município tem outras opções. **Converse com seu médico** e mostre esta
> página: só ele pode decidir se alguma delas serve para o seu caso.

O botão nunca diz "trocar por" nem "alternativa recomendada". Diz "ver o que a
lista tem para essa condição".

## Revisão farmacêutica

Todo conteúdo clínico carrega um bloco de revisão, **por página**, versionado.

```
Revisado por Fulana de Tal, farmacêutica — CRF-SC 00000 — em 12/03/2026.
Escopo: como tomar, armazenamento e efeitos comuns.
Não inclui avaliação de interações medicamentosas.
```

Regras:

- Os nomes dos revisores **não** vão para os Termos de Uso. Termo de uso não
  transfere responsabilidade profissional e expõe o revisor sem proteger
  ninguém. O crédito é por página, com escopo explícito.
- Cada revisor autoriza por escrito ser nomeado e em qual conteúdo.
- Revisão tem prazo. Passou de **18 meses**, o build marca a página como
  "revisão vencida" e some com o selo de revisão até alguém revisar de novo.
- Sem revisão registrada, o conteúdo clínico não é publicado. Sem exceção.

## Preço

Não existe base pública de preço médio praticado no varejo. Não tente raspar
site de farmácia.

Use o **PMC (Preço Máximo ao Consumidor) da tabela CMED/Anvisa**, que é o teto
legal, atualizado mensalmente, e chame pelo nome certo:

> **Preço máximo permitido por lei: R$ 48,90** por caixa de 30 comprimidos.
> Fonte: tabela CMED/Anvisa, atualizada em 03/2026.
> **Pelo SUS você paga R$ 0.**

Regras:

- Nunca escreva "preço médio" nem "custa em média". É o teto, não a média.
- Use a coluna de PMC correspondente à alíquota de ICMS de Santa Catarina.
  Confirme a alíquota vigente antes de publicar; usar a coluna de 0% subestima.
- Mostre por apresentação (a caixa), não por mês. Custo mensal exigiria a
  posologia e erra fácil.
- **Enquadramento:** é "você economizou", nunca "isso custou ao Estado". O
  usuário está exercendo um direito, não pedindo favor.
- Se o medicamento também estiver na Farmácia Popular, diga — o caminho pode ser
  mais curto que a UBS.

## Frases padrão

Reutilize exatamente estas, para o site falar sempre igual:

- **Aviso de rodapé:** "Este é um projeto independente, feito por voluntários.
  Não tem vínculo com a Prefeitura de Criciúma, com o Governo de Santa Catarina
  nem com o Ministério da Saúde. As informações são conferidas com frequência,
  mas confirme na unidade antes de sair de casa."
- **Recusa clínica:** "Essa pergunta é para o farmacêutico. Ele atende de graça
  na sua unidade e pode olhar todos os seus remédios juntos."
- **Dado desatualizado:** "Não conseguimos conferir esta informação desde
  {data}. Ela pode ter mudado. Ligue para {telefone} antes de ir."
- **Sem resultado:** "Não encontramos esse remédio na lista de Criciúma. Isso
  pode significar duas coisas: ele não é entregue aqui, ou está cadastrado com
  outro nome." Seguido do caminho: nome genérico, Farmácia Popular, CEAF.

## Telas vazias e erro

Tela vazia é convite para agir, não desculpa. Erro explica o que houve e o que
fazer. Nunca "algo deu errado". Nunca pedir desculpa.
