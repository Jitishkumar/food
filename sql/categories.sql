create table public.categories (
  id uuid not null default extensions.uuid_generate_v4 (),
  name text not null,
  icon text null,
  created_at timestamp with time zone null default now(),
  constraint categories_pkey primary key (id),
  constraint categories_name_key unique (name)
) TABLESPACE pg_default;