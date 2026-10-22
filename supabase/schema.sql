-- =====================================================================
-- Sucuk-Agent | Supabase Veritabanı Şeması
-- Bu dosyayı Supabase Dashboard > SQL Editor kısmında çalıştırın.
-- =====================================================================

-- 1. Kullanıcı profilleri (kayıt yok, sadece sign-in; admin/program aracılığıyla eklenir)
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  role text not null check (role in ('admin', 'user')) default 'user',
  created_at timestamptz not null default now()
);

-- 2. Sohbet odaları
create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'Yeni Sohbet',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Sohbet iletileri (yapay zekâ yanıtıyla birlikte sağlayıcı/model bilgisi)
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  sender text not null check (sender in ('user', 'assistant', 'system')),
  content text not null,
  provider text,
  model text,
  tool_calls jsonb,
  created_at timestamptz not null default now()
);

-- 4. Arkadaşlık ilişkileri
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  friend_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('pending', 'accepted', 'blocked')) default 'pending',
  created_at timestamptz not null default now(),
  unique (user_id, friend_id)
);

-- 5. Kullanıcılar arası doğrudan iletiler
create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- 6. Sistem duyuruları (yalnızca yönetici yayımlar)
create table if not exists public.system_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

-- 7. Dinamik araç entegrasyonları (yalnızca yönetici ekleyebilir/çıkarabilir)
create table if not exists public.dynamic_tools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  config jsonb not null default '{}'::jsonb,
  added_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

-- Indexler
create index if not exists idx_chats_user_id on public.chats(user_id);
create index if not exists idx_messages_chat_id on public.messages(chat_id);
create index if not exists idx_messages_created_at on public.messages(created_at);
create index if not exists idx_friendships_user_id on public.friendships(user_id);
create index if not exists idx_friendships_friend_id on public.friendships(friend_id);
create index if not exists idx_direct_messages_receiver on public.direct_messages(receiver_id);
create index if not exists idx_direct_messages_sender_receiver on public.direct_messages(sender_id, receiver_id);

-- Row Level Security (isteğe bağlı; servis rolü ile işlemler yapılıyor olsa da)
alter table public.profiles enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;
alter table public.friendships enable row level security;
alter table public.direct_messages enable row level security;
alter table public.system_announcements enable row level security;
alter table public.dynamic_tools enable row level security;

-- Geliştirme kolaylığı için açık politikalar (prod ile kısıtlanabilir)
create policy "profiles_all" on public.profiles for all using (true) with check (true);
create policy "chats_all" on public.chats for all using (true) with check (true);
create policy "messages_all" on public.messages for all using (true) with check (true);
create policy "friendships_all" on public.friendships for all using (true) with check (true);
create policy "direct_messages_all" on public.direct_messages for all using (true) with check (true);
create policy "announcements_all" on public.system_announcements for all using (true) with check (true);
create policy "dynamic_tools_all" on public.dynamic_tools for all using (true) with check (true);

-- Varsayılan hesaplar (servis rolü ile eklenebilir; kod tarafında ensureDemoProfiles ile de garanti altına alınır)
-- insert into public.profiles (id, username, role) values
--   ('demo-admin-001', 'Sucuk9977', 'admin'),
--   ('demo-user-001', 'Pirensine', 'user')
-- on conflict (username) do nothing;
