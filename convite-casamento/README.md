# Convite de casamento · Petherson & Anna

Página única (index.html) com vídeo de fundo, efeitos em WebGL e som.
Cada casal tem um link próprio: `https://<dominio>/<nome-do-casal>` (ex.: `/carlos-e-juliana`).

## Dados (Supabase · Strike Details DATABASE)
Tabela `cv_convites`: slug, convidados, papel (Padrinhos | Convidados), resposta (sim | nao), respondido_em, aberto_em, aberturas.
O site só acessa pelas funções `cv_abrir(slug)` e `cv_responder(slug, resposta)`.

Novo convite:
```sql
insert into cv_convites (slug, convidados, papel) values ('joao-e-maria', 'João & Maria', 'Padrinhos');
```
Ver respostas:
```sql
select convidados, papel, resposta, respondido_em, aberturas from cv_convites order by convidados;
```
