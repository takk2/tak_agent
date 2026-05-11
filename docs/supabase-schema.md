# Supabase 데이터베이스 스키마

TAK Agent 플랫폼에 필요한 Supabase 테이블 구조입니다.

## 1. users 테이블

Supabase Auth가 자동으로 관리하는 테이블이므로 별도 생성 불필요.

## 2. user_configs 테이블

사용자별 API 키와 설정을 저장합니다.

```sql
CREATE TABLE user_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  api_keys JSONB DEFAULT '{}'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- RLS (Row Level Security) 활성화
ALTER TABLE user_configs ENABLE ROW LEVEL SECURITY;

-- 정책: 자신의 config만 조회/수정 가능
CREATE POLICY "Users can view own config"
  ON user_configs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own config"
  ON user_configs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own config"
  ON user_configs
  FOR UPDATE
  USING (auth.uid() = user_id);
```

## 3. usage_history 테이블 (기존 수정)

사용자별 사용량을 추적합니다. 기존 테이블에 `user_id` 추가.

```sql
-- 기존 테이블이 있다면 수정
ALTER TABLE usage_history ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 새로 만드는 경우
CREATE TABLE usage_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  device_name TEXT,
  agent_name TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  cache_read_tokens INTEGER DEFAULT 0,
  cache_write_tokens INTEGER DEFAULT 0,
  cost_usd DECIMAL(10, 6) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE usage_history ENABLE ROW LEVEL SECURITY;

-- 정책: 자신의 사용량만 조회 가능
CREATE POLICY "Users can view own usage"
  ON usage_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage"
  ON usage_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 인덱스
CREATE INDEX idx_usage_history_user_id ON usage_history(user_id);
CREATE INDEX idx_usage_history_created_at ON usage_history(created_at);
```

## 4. API Keys 암호화 (권장)

프로덕션 환경에서는 API 키를 암호화해서 저장하는 것이 좋습니다.

```sql
-- pgcrypto 확장 활성화 (암호화용)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 암호화 함수 예시
-- 실제로는 서버 측에서 암호화 후 저장하는 것을 권장
```

## 설정 방법

1. Supabase 대시보드 접속
2. SQL Editor에서 위 스키마 실행
3. Authentication > Settings에서 이메일 인증 설정
4. API Keys 복사 (프로젝트 URL, anon key)
5. `.env` 파일에 추가:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your_anon_key
```

## 마이그레이션 (기존 usage_history가 있는 경우)

기존 로컬 usage_history를 마이그레이션하려면:

```sql
-- device_name 기반으로 사용자 매핑 (수동)
UPDATE usage_history
SET user_id = 'user-uuid-here'
WHERE device_name = 'device-name-here';
```
