create table public.businesses (
  id uuid not null default extensions.uuid_generate_v4 (),
  owner_id uuid null,
  business_name text not null,
  business_type text not null,
  phone_number text not null,
  address text null,
  latitude numeric(10, 8) not null,
  longitude numeric(11, 8) not null,
  description text null,
  image_url text null,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  city text null,
  state text null,
  constraint businesses_pkey primary key (id),
  constraint businesses_owner_id_fkey foreign KEY (owner_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;


create index IF not exists idx_businesses_lat on public.businesses using btree (latitude) TABLESPACE pg_default;


create index IF not exists idx_businesses_lon on public.businesses using btree (longitude) TABLESPACE pg_default;


create index IF not exists idx_businesses_owner on public.businesses using btree (owner_id) TABLESPACE pg_default;


create index IF not exists idx_businesses_city_state on public.businesses using btree (city, state) TABLESPACE pg_default; and now rls businesses
Disable RLSCreate policy
NameCommandApplied toActions
Businesses are viewable by everyone
SELECT
public
Owners can create businesses
INSERT
authenticated
Owners can update own businesses
UPDATE
authenticated