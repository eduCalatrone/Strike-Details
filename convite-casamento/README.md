# Convite de casamento · Petherson & Anna

Página única (index.html) com vídeo de fundo, efeitos em WebGL e som.
Cada casal tem um link próprio: `https://<dominio>/<nome-do-casal>` (ex.: `/carlos-e-juliana`).

## Dados (Supabase · Strike Details DATABASE)
Tabela `cv_convites`: slug, convidados, papel (Padrinhos | Convidados), resposta (sim), pessoas (até 4 nomes), respondido_em, aberto_em, aberturas, excluido_em.
O site só acessa pelas funções `cv_convite(slug)` e `cv_confirmar(slug, pessoas)`.
O Controle do Sistema Strike Details vê e cadastra os convites em Relatórios > Convites.

Novo convite:
```sql
insert into cv_convites (slug, convidados, papel) values ('joao-e-maria', 'João & Maria', 'Padrinhos');
```
Ver respostas:
```sql
select convidados, papel, resposta, pessoas, respondido_em, aberturas from cv_convites where excluido_em is null order by convidados;
```
