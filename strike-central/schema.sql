-- =====================================================================
-- Strike Estética Automotiva · Banco de Dados de Clientes
-- Schema, constraints e políticas de acesso (RLS).
--
-- Este arquivo é a única fonte de verdade do controle de acesso.
-- Não contém segredo nenhum: pode e deve ficar versionado.
--
-- Como aplicar: Supabase > SQL Editor > cole > Run.
-- Rodar de novo é seguro (tudo é idempotente).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tabelas
-- ---------------------------------------------------------------------

create table if not exists public.autorizados (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  empresa     text,
  whatsapp    text,
  email       text,
  uf          char(2) not null,
  cidade      text not null,
  observacoes text,
  ativo       boolean not null default true,
  matriz      boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.leads (
  id                 uuid primary key default gen_random_uuid(),
  nome               text not null,
  whatsapp           text not null,
  email              text,
  uf                 char(2) not null,
  cidade             text not null,
  endereco           text,
  veiculo            text,
  placa              text,
  servico_interesse  text,
  observacoes        text,
  origem             text,
  consentimento_lgpd boolean not null default false,
  status             text not null default 'novo',
  nota_interna       text,
  autorizado_id      uuid references public.autorizados(id) on delete set null,
  created_at         timestamptz not null default now()
);

create table if not exists public.historico (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null references public.leads(id) on delete cascade,
  usuario_id uuid not null references auth.users(id),
  acao       text not null,
  detalhe    text,
  created_at timestamptz not null default now()
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_status_idx     on public.leads (status);
create index if not exists historico_lead_idx   on public.historico (lead_id, created_at desc);

-- ---------------------------------------------------------------------
-- 2. Validação no servidor
--    O navegador não protege nada: qualquer um pode falar direto com a
--    API REST usando a chave anon, que é pública. As regras abaixo são
--    as únicas que valem.
-- ---------------------------------------------------------------------

do $$ begin
  alter table public.leads add constraint leads_uf_valida
    check (uf in ('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
                  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.leads add constraint leads_status_valido
    check (status in ('novo','em_contato','encaminhado','convertido','perdido'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.autorizados add constraint autorizados_uf_valida
    check (uf in ('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
                  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'));
exception when duplicate_object then null; end $$;

-- Limites de tamanho: sem isso, um script enche a tabela de texto gigante.
do $$ begin
  alter table public.leads add constraint leads_tamanhos check (
    length(nome)                     between 3 and 120 and
    length(whatsapp)                 between 10 and 15 and
    (email             is null or length(email)             <= 160) and
    (cidade            is null or length(cidade)            <= 90)  and
    (endereco          is null or length(endereco)          <= 200) and
    (veiculo           is null or length(veiculo)           <= 90)  and
    (placa             is null or length(placa)             <= 10)  and
    (servico_interesse is null or length(servico_interesse) <= 90)  and
    (observacoes       is null or length(observacoes)       <= 1000) and
    (origem            is null or length(origem)            <= 60)
  );
exception when duplicate_object then null; end $$;

-- WhatsApp só dígitos.
do $$ begin
  alter table public.leads add constraint leads_whatsapp_numerico
    check (whatsapp ~ '^[0-9]+$');
exception when duplicate_object then null; end $$;

-- Consentimento LGPD é obrigatório para gravar um lead.
do $$ begin
  alter table public.leads add constraint leads_consentimento
    check (consentimento_lgpd = true);
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- 3. Privilégios de coluna
--    O anônimo (formulário público) só pode INSERIR, e só as colunas do
--    formulário. Sem isso ele grava status, nota_interna e autorizado_id.
-- ---------------------------------------------------------------------

revoke all on public.leads       from anon;
revoke all on public.autorizados from anon;
revoke all on public.historico   from anon;

grant insert (nome, whatsapp, email, uf, cidade, endereco, veiculo,
              placa, servico_interesse, observacoes, origem, consentimento_lgpd)
  on public.leads to anon;

grant select, insert, update, delete on public.leads       to authenticated;
grant select, insert, update, delete on public.autorizados to authenticated;
grant select, insert                 on public.historico   to authenticated;

-- ---------------------------------------------------------------------
-- 4. RLS
-- ---------------------------------------------------------------------

alter table public.leads       enable row level security;
alter table public.autorizados enable row level security;
alter table public.historico   enable row level security;

alter table public.leads       force row level security;
alter table public.autorizados force row level security;
alter table public.historico   force row level security;

-- leads ---------------------------------------------------------------
drop policy if exists "anon cadastra lead"        on public.leads;
drop policy if exists "matriz le leads"           on public.leads;
drop policy if exists "matriz edita leads"        on public.leads;
drop policy if exists "matriz exclui leads"       on public.leads;

-- O formulário público só grava. Não lê nada de volta.
create policy "anon cadastra lead" on public.leads
  for insert to anon with check (true);

create policy "matriz le leads" on public.leads
  for select to authenticated using (true);

create policy "matriz edita leads" on public.leads
  for update to authenticated using (true) with check (true);

create policy "matriz exclui leads" on public.leads
  for delete to authenticated using (true);

-- autorizados ---------------------------------------------------------
drop policy if exists "publico le autorizados ativos" on public.autorizados;
drop policy if exists "matriz gerencia autorizados"   on public.autorizados;

create policy "matriz gerencia autorizados" on public.autorizados
  for all to authenticated using (true) with check (true);

-- historico -----------------------------------------------------------
drop policy if exists "matriz le historico"     on public.historico;
drop policy if exists "matriz grava historico"  on public.historico;

create policy "matriz le historico" on public.historico
  for select to authenticated using (true);

-- Trava o forjamento: o usuario_id gravado tem que ser o de quem está logado.
create policy "matriz grava historico" on public.historico
  for insert to authenticated with check (usuario_id = auth.uid());

-- ---------------------------------------------------------------------
-- 5. Conferência (rode depois de aplicar)
--    force_rls e relrowsecurity precisam vir 't' nas três tabelas.
-- ---------------------------------------------------------------------
-- select relname, relrowsecurity, relforcerowsecurity
--   from pg_class where relname in ('leads','autorizados','historico');
-- select tablename, policyname, cmd, roles from pg_policies where schemaname = 'public';

-- ---------------------------------------------------------------------
-- 6. O que NÃO dá para resolver aqui — fazer no painel do Supabase
--    a) Authentication > Providers > Email > "Enable signup": DESLIGAR.
--       Ligado, qualquer pessoa cria conta e vira 'authenticated' — ou
--       seja, entra no /painel e lê a base inteira.
--       Crie os usuários da matriz manualmente em Authentication > Users.
--    b) Database > Backups: ligar o backup automático (o painel faz
--       exclusão definitiva, sem lixeira).
-- ---------------------------------------------------------------------
