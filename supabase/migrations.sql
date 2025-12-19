-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create certifications table
create table public.certifications (
  id uuid default gen_random_uuid() primary key,
  certification_name text not null,
  domain text not null,
  language_framework text not null,
  url text,
  provider text not null,
  price numeric,
  currency text default 'USD',
  experience_level text,
  certificate_quality text,
  last_checked date,
  notes text,
  price_in_eur numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create user_certifications table (for saving, applying, completing)
create table public.user_certifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  certification_id uuid references public.certifications(id) on delete cascade not null,
  status text not null check (status in ('saved', 'applied', 'completed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, certification_id, status)
);

-- Create applications table (specifically for funding requests)
create table public.applications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  certification_id uuid references public.certifications(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.certifications enable row level security;
alter table public.user_certifications enable row level security;
alter table public.applications enable row level security;

-- Policies for profiles
create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Policies for certifications
create policy "Certifications are viewable by everyone" on public.certifications
  for select using (true);

create policy "Admins can insert certifications" on public.certifications
  for insert with check (exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  ));

create policy "Admins can update certifications" on public.certifications
  for update using (exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  ));

-- Policies for user_certifications
create policy "Users can view own certifications" on public.user_certifications
  for select using (auth.uid() = user_id);

create policy "Admins can view all user certifications" on public.user_certifications
  for select using (exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  ));

create policy "Users can insert own certifications" on public.user_certifications
  for insert with check (auth.uid() = user_id);

create policy "Users can update own certifications" on public.user_certifications
  for update using (auth.uid() = user_id);

create policy "Users can delete own certifications" on public.user_certifications
  for delete using (auth.uid() = user_id);


-- Policies for applications
create policy "Users can view own applications" on public.applications
  for select using (auth.uid() = user_id);

create policy "Admins can view all applications" on public.applications
  for select using (exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  ));

create policy "Users can insert own applications" on public.applications
  for insert with check (auth.uid() = user_id);

create policy "Admins can update applications" on public.applications
  for update using (exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  ));

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create admin_settings table
create table public.admin_settings (
  key text primary key,
  value text not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.admin_settings enable row level security;

create policy "Admins can view settings" on public.admin_settings
  for select using (exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  ));

create policy "Admins can manage settings" on public.admin_settings
  for all using (exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  ));
