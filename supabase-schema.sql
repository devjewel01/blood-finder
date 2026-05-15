-- Run this in Supabase SQL Editor

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

-- Auto-create profile on signup
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

-- Row Level Security
alter table profiles enable row level security;
alter table donors enable row level security;
alter table blood_requests enable row level security;
alter table donation_records enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Donors policies
create policy "Approved donors are viewable by everyone" on donors for select using (is_approved = true);
create policy "Admins can view all donors" on donors for select using (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);
create policy "Users can insert own donor record" on donors for insert with check (auth.uid() = user_id);
create policy "Users can update own donor record" on donors for update using (auth.uid() = user_id);
create policy "Admins can update any donor" on donors for update using (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);

-- Blood requests policies
create policy "Users can view own requests" on blood_requests for select using (
  auth.uid() = requester_id or
  auth.uid() = (select user_id from donors where id = donor_id)
);
create policy "Admins can view all requests" on blood_requests for select using (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);
create policy "Logged in users can create requests" on blood_requests for insert with check (auth.uid() = requester_id);
create policy "Donors and admins can update requests" on blood_requests for update using (
  auth.uid() = (select user_id from donors where id = donor_id) or
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);

-- Donation records policies
create policy "Relevant users can view donation records" on donation_records for select using (
  auth.uid() = requester_id or
  auth.uid() = (select user_id from donors where id = donor_id)
);
create policy "Admins can view all donation records" on donation_records for select using (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);
create policy "System can insert donation records" on donation_records for insert with check (true);
