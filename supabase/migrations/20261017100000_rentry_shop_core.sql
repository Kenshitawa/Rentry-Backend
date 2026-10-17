create table if not exists public.products (
 id text primary key,name text not null,brand text not null,category text not null,price numeric not null check(price>0),image text not null,image_credit text not null default '',badge text not null default 'In stock',rating text not null default '—',description text not null,stock integer not null default 0 check(stock>=0),specs jsonb not null default '[]'::jsonb,sort_order integer not null default 0,created_at timestamptz not null default now()
);
create table if not exists public.customers (id text primary key,email text not null unique,name text not null,picture text not null default '',created_at timestamptz not null default now());
create table if not exists public.customer_sessions (token_hash text primary key,customer_id text not null references public.customers(id) on delete cascade,expires_at timestamptz not null);
create table if not exists public.subscribers (email text primary key,created_at timestamptz not null default now(),origin text not null default 'STOREFRONT',consent_confirmed boolean not null default false);
create table if not exists public.customer_contacts (id text primary key,name text not null,email text not null default '',phone text not null default '',notes text not null default '',created_at timestamptz not null default now());
create table if not exists public.orders (id text primary key,customer_id text references public.customers(id),customer text not null,phone text not null,address text not null,items jsonb not null,amount numeric not null,status text not null default 'PENDING',payment_status text not null default 'PENDING',checkout_request_id text,merchant_request_id text,mpesa_receipt text,origin text not null default 'CUSTOMER',created_at timestamptz not null default now());
create index if not exists orders_customer_idx on public.orders(customer_id,created_at desc);
create index if not exists orders_phone_idx on public.orders(phone);
create unique index if not exists orders_checkout_request_idx on public.orders(checkout_request_id) where checkout_request_id is not null;
create table if not exists public.trade_ins (id text primary key,customer_name text not null,phone text not null,equipment_details text not null,status text not null default 'NEW',created_at timestamptz not null default now());
create table if not exists public.house_listings (id text primary key,title text not null,style text not null,bedrooms integer not null,bathrooms integer not null,floors integer not null,area_sqm numeric not null,estimated_cost_min numeric not null,estimated_cost_max numeric not null,description text not null,image_url text not null,image_credit text not null default '',image_source text not null default '',plan_image_url text not null,active boolean not null default true,created_at timestamptz not null default now());
create table if not exists public.project_inquiries (id text primary key,name text not null,email text not null,phone text not null,location text not null,listing_id text not null default '',listing_title text not null default 'General project',services jsonb not null default '[]'::jsonb,notes text not null default '',status text not null default 'NEW',created_at timestamptz not null default now());
create index if not exists project_inquiries_created_idx on public.project_inquiries(created_at desc);

create or replace function public.create_order_atomic(p_name text,p_phone text,p_address text,p_customer_id text,p_origin text,p_items jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
declare item jsonb; product_row public.products%rowtype; qty integer; lines jsonb:='[]'::jsonb; total numeric:=0; order_id text;
begin
 if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)<1 then raise exception 'At least one item is required.';end if;
 for item in select value from jsonb_array_elements(p_items) loop
  qty:=(item->>'quantity')::integer;if qty<1 or qty>500 then raise exception 'Invalid product quantity.';end if;
  select * into product_row from public.products where id=item->>'productId' for update;
  if not found then raise exception 'One or more products are no longer available.';end if;
  if product_row.stock<qty then raise exception '% has only % in stock.',product_row.name,product_row.stock;end if;
  update public.products set stock=stock-qty,badge=case when stock-qty>0 then 'In stock' else 'Out of stock' end where id=product_row.id;
  total:=total+product_row.price*qty;lines:=lines||jsonb_build_array(jsonb_build_object('productId',product_row.id,'name',product_row.name,'quantity',qty,'unitPrice',product_row.price));
 end loop;
 order_id:='RE-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));
 insert into public.orders(id,customer_id,customer,phone,address,items,amount,origin) values(order_id,p_customer_id,p_name,p_phone,p_address,lines,total,p_origin);
 return jsonb_build_object('id',order_id,'amount',total);
end $$;
create or replace function public.fail_order_and_restock(p_id text) returns boolean language plpgsql security definer set search_path=public as $$
declare ord public.orders%rowtype;item jsonb;
begin
 select * into ord from public.orders where id=p_id for update;if not found or ord.payment_status<>'PENDING' then return false;end if;
 for item in select value from jsonb_array_elements(ord.items) loop update public.products set stock=stock+(item->>'quantity')::integer,badge='In stock' where id=item->>'productId';end loop;
 update public.orders set payment_status='FAILED',status='CANCELLED' where id=p_id;return true;
end $$;
create or replace function public.complete_mpesa_payment(p_checkout_id text,p_result_code integer,p_receipt text default null) returns boolean language plpgsql security definer set search_path=public as $$
declare ord public.orders%rowtype;item jsonb;
begin
 select * into ord from public.orders where checkout_request_id=p_checkout_id for update;if not found then return false;end if;if ord.payment_status<>'PENDING' then return true;end if;
 if p_result_code=0 then update public.orders set payment_status='PAID',status='CONFIRMED',mpesa_receipt=p_receipt where id=ord.id;
 else for item in select value from jsonb_array_elements(ord.items) loop update public.products set stock=stock+(item->>'quantity')::integer,badge='In stock' where id=item->>'productId';end loop;update public.orders set payment_status='FAILED',status='CANCELLED' where id=ord.id;end if;return true;
end $$;

do $$ declare t text;begin foreach t in array array['products','customers','customer_sessions','subscribers','customer_contacts','orders','trade_ins','house_listings','project_inquiries'] loop execute format('alter table public.%I enable row level security',t);execute format('revoke all on public.%I from anon,authenticated',t);execute format('grant all on public.%I to service_role',t);end loop;end $$;
revoke all on function public.create_order_atomic(text,text,text,text,text,jsonb) from public,anon,authenticated;
revoke all on function public.fail_order_and_restock(text) from public,anon,authenticated;
revoke all on function public.complete_mpesa_payment(text,integer,text) from public,anon,authenticated;
grant execute on function public.create_order_atomic(text,text,text,text,text,jsonb) to service_role;
grant execute on function public.fail_order_and_restock(text) to service_role;
grant execute on function public.complete_mpesa_payment(text,integer,text) to service_role;
