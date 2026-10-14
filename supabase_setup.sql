-- ==========================================================
-- 우리 둘의 소원 보관함 - Supabase 데이터베이스 초기 설정 SQL
-- ==========================================================
-- Supabase 대시보드 (https://supabase.com) > SQL Editor에 복사하여
-- [RUN] 버튼을 눌러 한 번만 실행해주시면 테이블이 생성됩니다.

-- 1. 소원 테이블 생성
CREATE TABLE IF NOT EXISTS wishes (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_avatar TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'registered', -- registered(등록), completed(완료), expired(소멸)
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  expires_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ
);

-- 2. 누구나 읽고 쓸 수 있는 RLS (Row Level Security) 설정
ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" 
ON wishes FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert" 
ON wishes FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update" 
ON wishes FOR UPDATE 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow public delete" 
ON wishes FOR DELETE 
USING (true);

-- 3. 두 기기 간 실시간(Realtime) 변경 감지 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE wishes;
