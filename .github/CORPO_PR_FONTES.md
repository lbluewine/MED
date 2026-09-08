Uma das fontes mudou. O robô baixou a versão nova, guardou o arquivo de origem
e rodou os extratores. **Ninguém publicou nada ainda.**

## Como revisar

Vá item a item no diff dos arquivos em `data/`. Diff pequeno se revisa em cinco
minutos, e é para isso que a conferência é semanal.

Procure principalmente por:

- [ ] Medicamento que **saiu** da lista. Alguém que tomava vai chegar na
      farmácia e não encontrar.
- [ ] Mudança de **onde retirar**. Manda gente para o lugar errado.
- [ ] Mudança de **tipo de receita**. Faz a pessoa voltar para casa.
- [ ] Endereço ou telefone de unidade.
- [ ] Item novo com campo vazio, que a extração pode não ter entendido.

Compare com o arquivo de origem quando algo parecer estranho: ele está em
`data/fontes/`, na mesma versão que gerou este diff. Quando alguém disser que
está errado, é ali que se descobre se o erro foi nosso ou da fonte.

## Antes do merge

- [ ] `npm run valida-dados` sem erro
- [ ] `npm run build` sem erro nem warning novo
- [ ] O diff faz sentido para quem vai à farmácia amanhã

Se o diff estiver grande ou confuso, **não faça merge**. Um site pequeno e
certo vale mais que um grande e desatualizado.
