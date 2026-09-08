# PROJETO.md — o que é e o que não é

## O problema

A informação sobre medicamentos do SUS já é pública, mas está espalhada e escrita
para quem trabalha na área:

- A REMUME de Criciúma é um PDF de 27 páginas no site da prefeitura.
- O app MedSUS (Ministério da Saúde) existe, mas é criticado por
  desatualização e por não deixar claro o que se retira na UBS, na Farmácia
  Popular ou na farmácia de alto custo.
- O processo do CEAF (alto custo) é explicado em cartilhas genéricas que dizem
  "traga o LME e os exames necessários" sem dizer **quais** exames para **qual**
  doença.

Resultado: gente que tem direito ao medicamento não consegue, compra do próprio
bolso, ou entra na justiça por falta de informação.

## O que o site faz

Três coisas, nessa ordem de importância:

1. **"Tem no SUS?"** — busca pelo nome do medicamento e responde: tem ou não tem em
   Criciúma, de qual componente é (básico / especializado / estratégico), onde
   retirar e o que levar.
2. **"Onde pegar"** — mapa e lista das farmácias e dispensários do município,
   com horário, telefone e o que cada unidade dispensa.
3. **"Como pedir alto custo"** — guia passo a passo do CEAF em Santa Catarina,
   com checklist imprimível por medicamento/condição.

## O diferencial

Não é o dado, que é todo público. É a **tradução**. Três camadas que ninguém
junta hoje:

- o que tem **aqui** (municipal, não nacional genérico);
- **como conseguir** (processo, documentos, endereço, ordem dos passos);
- em **linguagem de gente** (ver `docs/CONTEUDO.md`).

## Público-alvo

Ordem de prioridade ao decidir qualquer coisa:

1. Paciente idoso ou cuidador, baixa escolaridade digital, celular simples.
2. Familiar mais jovem pesquisando em nome de alguém.
3. Profissional da ponta (auxiliar, técnico, agente comunitário) que precisa
   conferir algo rápido.

O profissional de saúde **não** é o público principal. Se uma decisão agrada o
profissional e complica para o idoso, o idoso ganha.

## Não-objetivos (importantes)

O site **não**:

- **substitui consulta.** Nunca sugere, indica ou desaconselha tratamento.
- **checa interações medicamentosas.** Interação é combinatória e não dá para
  revisar par a par. No lugar disso, o site oferece a "Minha lista" para o
  usuário levar ao farmacêutico.
- **mostra estoque em tempo real.** Isso exige integração com a prefeitura. Não
  prometer o que não se pode entregar.
- **é oficial.** Rodapé em toda página deixa claro que é um projeto
  independente, sem vínculo com a prefeitura, o estado ou o Ministério da Saúde.
- **coleta dados de usuário.** Sem login, sem conta, sem cookie de identificação.
  Dado de saúde é dado sensível (LGPD). A melhor proteção é não ter o dado.

## Escala

O modelo é **template + colaborador local**, não cadastro centralizado. Cada
município é um arquivo de dados separado, no mesmo formato. Alguém de Içara ou
Tubarão abre um pull request com a REMUME de lá.

Consequência prática: **nada no código pode assumir que Criciúma é o único
município.** Ver `docs/DADOS.md`.

Consequência importante para o conteúdo: **as REMUMEs atendem residentes.** Vários
municípios exigem que a pessoa more no município e tenha receita da rede local.
Então o site nunca diz "o município X fornece, vá lá" sem avisar disso.

## Sustentabilidade

Projeto sem fins lucrativos, voluntário. Isso significa:

- Custo de infra tem que ser **zero ou perto disso**.
- Manutenção tem que caber em algumas horas por mês.
- Prometer pouco e manter tudo é melhor que prometer muito e desatualizar.
- Código aberto desde o primeiro commit.

Parceiros a buscar (não bloqueiam o início): UNESC (curso de Farmácia e Farmácia
Escola, que opera o CEAF em Criciúma), CRF-SC, Conselho Municipal de Saúde,
Secretaria Municipal de Saúde.
