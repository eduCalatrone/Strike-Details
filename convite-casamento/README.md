# Convite de casamento · Petherson & Anna

Página única (index.html) com vídeo de fundo, efeitos em WebGL e som.
Padrinhos: cada casal tem um link próprio, `https://<dominio>/<nome-do-casal>` (ex.: `/alexandre-e-laiany`).
Convidados: um link só para todos, o endereço principal (`https://<dominio>/`, também `/convidados`); o convidado escreve o próprio nome e o do acompanhante e escolhe os padrinhos que o convidaram.
Perfil de teste: `/teste` (Casal Teste) nunca grava a confirmação, serve para ver as animações.

## Dados (Supabase · Strike Details DATABASE)
Tabela `cv_convites`: slug, convidados, papel (Padrinhos | Convidados), resposta (sim), pessoas (até 4 nomes), respondido_em, aberto_em, aberturas, excluido_em.
Tabela `cv_confirmacoes`: cada confirmação (padrinhos e convidados) com os nomes, os padrinhos que convidaram e os dados do aparelho (`meta`: modelo, navegador, tela, fuso, cidade pelo IP via ipwho.is/geojs; `meta_servidor`: IP e navegador do pedido).
O site só acessa pelas funções `cv_convite(slug)`, `cv_padrinhos()`, `cv_confirmar_padrinhos(slug, pessoas, meta)` e `cv_confirmar_convidados(id, pessoas, padrinhos, meta)`.
O Controle do Sistema Strike Details vê e cadastra os convites em Relatórios > Convites.

Novo convite:
```sql
insert into cv_convites (slug, convidados, papel) values ('joao-e-maria', 'João & Maria', 'Padrinhos');
```
Ver respostas:
```sql
select convidados, papel, resposta, pessoas, respondido_em, aberturas from cv_convites where excluido_em is null order by convidados;
```
