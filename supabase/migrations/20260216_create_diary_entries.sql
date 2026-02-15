-- Bad Day: diary_entries 테이블 생성
create table if not exists diary_entries (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  user_name text not null,
  content text not null,
  emotion text,
  emotion_score float,
  ai_message text,
  music_keyword text,
  music_url text,
  music_title text,
  created_at timestamptz default now()
);

-- 인덱스
create index if not exists idx_diary_entries_user_id on diary_entries(user_id);
create index if not exists idx_diary_entries_created_at on diary_entries(created_at desc);
create index if not exists idx_diary_entries_emotion on diary_entries(emotion);

-- RLS 활성화
alter table diary_entries enable row level security;

-- 본인 데이터만 조회
create policy "Users can view own diary entries"
  on diary_entries for select
  using (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 본인만 삽입
create policy "Users can insert own diary entries"
  on diary_entries for insert
  with check (true);

-- 본인 데이터만 삭제
create policy "Users can delete own diary entries"
  on diary_entries for delete
  using (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 본인 데이터만 수정
create policy "Users can update own diary entries"
  on diary_entries for update
  using (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
