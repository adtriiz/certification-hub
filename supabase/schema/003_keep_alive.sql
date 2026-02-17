-- Keep-Alive Table Migration
-- Simple single-row table for tracking database pings

create table if not exists public.keep_alive (
  id integer primary key default 1,
  last_ping timestamp with time zone default timezone('utc'::text, now()) not null,
  ping_count integer default 0 not null,
  constraint single_row_check check (id = 1)
);

-- Enable RLS
alter table public.keep_alive enable row level security;

-- Allow anon access (GitHub Actions uses anon key)
-- Note: This table contains no sensitive data
create policy "Allow keep-alive access" on public.keep_alive
  for all using (true) with check (true);

-- Insert initial row
insert into public.keep_alive (id, last_ping, ping_count)
values (1, timezone('utc'::text, now()), 0)
on conflict (id) do nothing;

-- Function to atomically increment ping count
create or replace function public.increment_ping()
returns trigger as $$
begin
  new.ping_count = old.ping_count + 1;
  return new;
end;
$$ language plpgsql;

-- Auto-increment trigger
drop trigger if exists auto_increment_ping on public.keep_alive;
create trigger auto_increment_ping
  before update on public.keep_alive
  for each row
  execute function public.increment_ping();
