create table public.food_items (
  id uuid not null default extensions.uuid_generate_v4 (),
  business_id uuid null,
  name text not null,
  description text null,
  category_id uuid null,
  special_food_id uuid null,
  price numeric(10, 2) null,
  image_url text null,
  is_available boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  inventory_count integer null,
  allow_purchase boolean null default true,
  city text null,
  state text null,
  constraint food_items_pkey primary key (id),
  constraint food_items_business_id_fkey foreign KEY (business_id) references businesses (id) on delete CASCADE,
  constraint food_items_category_id_fkey foreign KEY (category_id) references categories (id),
  constraint food_items_special_food_id_fkey foreign KEY (special_food_id) references special_foods (id)
) TABLESPACE pg_default;

create index IF not exists idx_food_items_business on public.food_items using btree (business_id) TABLESPACE pg_default;

create index IF not exists idx_food_items_category on public.food_items using btree (category_id) TABLESPACE pg_default;

create index IF not exists idx_food_items_city_state on public.food_items using btree (city, state) TABLESPACE pg_default;