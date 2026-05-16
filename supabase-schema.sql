-- Run this in Supabase SQL Editor.
-- Safe to re-run: every statement is idempotent.

-- ============================================================================
-- Tables
-- ============================================================================

-- Profiles (extends auth.users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  email text not null,
  mobile text,
  location text,
  is_admin boolean default false,
  created_at timestamp with time zone default now()
);

-- Donors
create table if not exists donors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade unique,
  blood_type text not null,
  location text not null,
  availability_status text default 'AVAILABLE',
  last_donation_date date,
  is_approved boolean default false,
  created_at timestamp with time zone default now()
);

-- Blood Requests
create table if not exists blood_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references profiles(id) on delete cascade,
  donor_id uuid references donors(id) on delete cascade,
  status text default 'PENDING',
  notes text,
  created_at timestamp with time zone default now()
);

-- Donation Records (immutable)
create table if not exists donation_records (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid references donors(id) on delete cascade,
  requester_id uuid references profiles(id) on delete cascade,
  request_id uuid references blood_requests(id) on delete cascade,
  donation_date date not null,
  created_at timestamp with time zone default now()
);

-- ============================================================================
-- Enum-like CHECK constraints (PostgreSQL doesn't easily add native enums later)
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'donors_blood_type_check') then
    alter table donors add constraint donors_blood_type_check
      check (blood_type in ('A_POS','A_NEG','B_POS','B_NEG','AB_POS','AB_NEG','O_POS','O_NEG'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'donors_availability_check') then
    alter table donors add constraint donors_availability_check
      check (availability_status in ('AVAILABLE','UNAVAILABLE'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'blood_requests_status_check') then
    alter table blood_requests add constraint blood_requests_status_check
      check (status in ('PENDING','ACCEPTED','CANCELLED','COMPLETED'));
  end if;
end $$;

-- Prevent duplicate PENDING requests from the same user to the same donor.
create unique index if not exists blood_requests_unique_pending
  on blood_requests (requester_id, donor_id)
  where status = 'PENDING';

-- Helpful lookup indexes for the search and dashboard queries.
create index if not exists donors_search_idx
  on donors (is_approved, availability_status, blood_type);
create index if not exists blood_requests_requester_idx
  on blood_requests (requester_id, created_at desc);
create index if not exists blood_requests_donor_idx
  on blood_requests (donor_id, created_at desc);
create index if not exists donation_records_donor_idx
  on donation_records (donor_id, donation_date desc);

-- ============================================================================
-- Auto-create profile on signup
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table profiles enable row level security;
alter table donors enable row level security;
alter table blood_requests enable row level security;
alter table donation_records enable row level security;

-- ---- Profiles ----
-- Drop old permissive policy if it exists, then re-create tighter ones.
drop policy if exists "Public profiles are viewable by everyone" on profiles;
drop policy if exists "Profiles viewable by self" on profiles;
drop policy if exists "Profiles of approved donors viewable" on profiles;
drop policy if exists "Profiles viewable by authenticated users" on profiles;
drop policy if exists "Admins can view all profiles" on profiles;

create policy "Profiles viewable by self"
  on profiles for select
  using (auth.uid() = id);

create policy "Profiles viewable by authenticated users"
  on profiles for select
  using (auth.role() = 'authenticated');

-- Anonymous visitors may see profiles of approved donors (for the public search).
create policy "Profiles of approved donors viewable"
  on profiles for select
  using (exists (select 1 from donors where user_id = profiles.id and is_approved = true));

create policy "Admins can view all profiles"
  on profiles for select
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true));

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

drop policy if exists "Admins can update any profile" on profiles;
create policy "Admins can update any profile"
  on profiles for update
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true));

-- ---- Donors ----
drop policy if exists "Approved donors are viewable by everyone" on donors;
drop policy if exists "Admins can view all donors" on donors;
drop policy if exists "Users can view own donor record" on donors;
drop policy if exists "Users can insert own donor record" on donors;
drop policy if exists "Users can update own donor record" on donors;
drop policy if exists "Admins can update any donor" on donors;
drop policy if exists "Admins can delete donors" on donors;

create policy "Approved donors are viewable by everyone"
  on donors for select
  using (is_approved = true);

create policy "Users can view own donor record"
  on donors for select
  using (auth.uid() = user_id);

create policy "Admins can view all donors"
  on donors for select
  using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

create policy "Users can insert own donor record"
  on donors for insert
  with check (auth.uid() = user_id);

create policy "Users can update own donor record"
  on donors for update
  using (auth.uid() = user_id);

create policy "Admins can update any donor"
  on donors for update
  using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

create policy "Admins can delete donors"
  on donors for delete
  using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

-- ---- Blood requests ----
drop policy if exists "Users can view own requests" on blood_requests;
drop policy if exists "Admins can view all requests" on blood_requests;
drop policy if exists "Logged in users can create requests" on blood_requests;
drop policy if exists "Donors and admins can update requests" on blood_requests;

create policy "Users can view own requests"
  on blood_requests for select
  using (
    auth.uid() = requester_id
    or auth.uid() = (select user_id from donors where id = donor_id)
  );

create policy "Admins can view all requests"
  on blood_requests for select
  using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

create policy "Logged in users can create requests"
  on blood_requests for insert
  with check (auth.uid() = requester_id);

create policy "Requesters can cancel own pending requests"
  on blood_requests for update
  using (auth.uid() = requester_id);

create policy "Donors and admins can update requests"
  on blood_requests for update
  using (
    auth.uid() = (select user_id from donors where id = donor_id)
    or exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- ---- Donation records ----
drop policy if exists "Relevant users can view donation records" on donation_records;
drop policy if exists "Admins can view all donation records" on donation_records;
drop policy if exists "System can insert donation records" on donation_records;
drop policy if exists "Donors can insert own donation records" on donation_records;

create policy "Relevant users can view donation records"
  on donation_records for select
  using (
    auth.uid() = requester_id
    or auth.uid() = (select user_id from donors where id = donor_id)
  );

create policy "Admins can view all donation records"
  on donation_records for select
  using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

-- Only the donor of a record may insert it (matches the "accept request" flow).
create policy "Donors can insert own donation records"
  on donation_records for insert
  with check (auth.uid() = (select user_id from donors where id = donor_id));
