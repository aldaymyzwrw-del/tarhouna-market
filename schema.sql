
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  city text default 'ترهونة',
  role text default 'customer' check (role in ('customer','seller','driver','restaurant','admin')),
  created_at timestamptz default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  price numeric not null check (price >= 0),
  category text default 'أخرى',
  city text default 'ترهونة',
  image_url text,
  status text default 'active' check (status in ('active','sold','hidden')),
  created_at timestamptz default now()
);

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  name text not null,
  description text,
  phone text,
  city text default 'ترهونة',
  is_open boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references public.profiles(id) on delete set null,
  name text not null,
  category text not null,
  description text,
  phone text,
  city text default 'ترهونة',
  created_at timestamptz default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.profiles(id) on delete set null,
  seller_id uuid references public.profiles(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  order_type text default 'product' check (order_type in ('product','restaurant','delivery','taxi','service')),
  total numeric default 0,
  delivery_fee numeric default 0,
  commission numeric default 0,
  status text default 'pending',
  pickup_address text,
  dropoff_address text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.restaurants enable row level security;
alter table public.services enable row level security;
alter table public.orders enable row level security;

create policy "public can read active products" on public.products for select using (status='active');
create policy "authenticated can create products" on public.products for insert to authenticated with check (true);
create policy "owners can update products" on public.products for update to authenticated using (seller_id=auth.uid()) with check (seller_id=auth.uid());
create policy "public can read restaurants" on public.restaurants for select using (true);
create policy "public can read services" on public.services for select using (true);
create policy "users read own orders" on public.orders for select to authenticated using (customer_id=auth.uid() or seller_id=auth.uid());
create policy "users create orders" on public.orders for insert to authenticated with check (customer_id=auth.uid());
