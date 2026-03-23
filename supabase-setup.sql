-- ============================================
-- VibeCoding 갤러리 플랫폼 - Supabase 초기 설정
-- Supabase SQL Editor에서 이 파일 전체를 실행하세요
-- ============================================

-- 1. profiles 테이블
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null default 'Anonymous',
  avatar_url text not null default '',
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "Anyone can view profiles" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- 2. 새 사용자 자동 프로필 생성 트리거
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Anonymous'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '')
  );
  return new;
exception when others then
  raise warning 'Failed to create profile for user %: %', new.id, sqlerrm;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. projects 테이블
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 100),
  description text check (char_length(description) <= 500),
  screenshot_url text not null,
  file_url text not null,
  preview_url text,
  tool_used text check (char_length(tool_used) <= 50),
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now()
);

alter table public.projects enable row level security;
create policy "Anyone can view projects" on public.projects for select using (true);
create policy "Authenticated can insert" on public.projects for insert with check (auth.uid() = user_id);
create policy "Owner can update" on public.projects for update using (auth.uid() = user_id);
create policy "Owner can delete" on public.projects for delete using (auth.uid() = user_id);

create index if not exists idx_projects_created_at on public.projects(created_at desc);
create index if not exists idx_projects_user_id on public.projects(user_id);

-- 4. Storage 버킷 생성
insert into storage.buckets (id, name, public) values ('screenshots', 'screenshots', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('project-files', 'project-files', false) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('previews', 'previews', true) on conflict do nothing;

-- 5. Storage RLS (소유권 기반)
-- screenshots
create policy "Public read screenshots" on storage.objects for select using (bucket_id = 'screenshots');
create policy "Owner upload screenshots" on storage.objects for insert with check (
  bucket_id = 'screenshots' and auth.role() = 'authenticated' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "Owner delete screenshots" on storage.objects for delete using (
  bucket_id = 'screenshots' and (storage.foldername(name))[1] = auth.uid()::text
);

-- project-files
create policy "Auth read files" on storage.objects for select using (bucket_id = 'project-files' and auth.role() = 'authenticated');
create policy "Owner upload files" on storage.objects for insert with check (
  bucket_id = 'project-files' and auth.role() = 'authenticated' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "Owner delete files" on storage.objects for delete using (
  bucket_id = 'project-files' and (storage.foldername(name))[1] = auth.uid()::text
);

-- previews
create policy "Public read previews" on storage.objects for select using (bucket_id = 'previews');
create policy "Owner upload previews" on storage.objects for insert with check (
  bucket_id = 'previews' and auth.role() = 'authenticated' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "Owner delete previews" on storage.objects for delete using (
  bucket_id = 'previews' and (storage.foldername(name))[1] = auth.uid()::text
);
