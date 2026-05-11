# TAK Agent 설치 및 설정 가이드

## 1. 설치

```bash
# 저장소 클론
git clone https://github.com/your-org/tak_agent.git
cd tak_agent

# 메인 패키지 설치
npm install

# 서버 패키지 설치
cd server && npm install && cd ..

# 프론트엔드 패키지 설치
cd frontend && npm install && cd ..

# 전역 설치 (선택사항)
npm link
```

## 2. Supabase 설정

### 2.1 Supabase 프로젝트 생성

1. [Supabase](https://supabase.com) 접속
2. 새 프로젝트 생성
3. 데이터베이스 비밀번호 설정 및 리전 선택

### 2.2 데이터베이스 스키마 생성

Supabase Dashboard > SQL Editor에서 [supabase-schema.md](./supabase-schema.md) 의 SQL을 실행하세요.

### 2.3 환경변수 설정

루트 디렉토리에 `.env` 파일 생성:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your_anon_key

# 선택사항: 서버 포트
PORT=3000
```

프론트엔드 디렉토리에도 `.env` 파일 생성:

```bash
cd frontend
cp .env.example .env
# 편집기로 .env 열어서 Supabase 정보 입력
```

## 3. 초기 설정

### 웹 기반 설정 (권장)

```bash
tak init
```

브라우저가 자동으로 열리면:
1. 회원가입 또는 로그인
2. API 키 입력 (OpenAI, Anthropic, Gemini)
3. 저장 후 Ctrl+C로 종료

### CLI 기반 설정 (기존 방식)

```bash
tak init --cli
```

터미널에서 순차적으로 API 키 입력.

## 4. 개발 환경 실행

### 서버 개발 모드

```bash
cd server
npm run dev
```

### 프론트엔드 개발 모드

```bash
cd frontend
npm run dev
```

### 프로덕션 빌드

```bash
# 프론트엔드 빌드
cd frontend
npm run build

# 서버 실행 (프론트엔드 정적 파일 서빙)
cd ../server
npm start
```

## 5. 사용법

### CLI 명령어

```bash
# 개발 모드
tak dev

# 채팅 모드
tak chat

# 사용량 조회
tak --usage

# 도움말
tak --help
```

### 웹 UI

브라우저에서 `http://localhost:3000` 접속 (서버 실행 중일 때)

## 6. 여러 기기에서 사용하기

TAK Agent는 Supabase 클라우드에 설정을 저장하므로, 여러 기기에서 같은 계정으로 로그인하면 자동으로 동기화됩니다.

1. 각 기기에 TAK Agent 설치
2. `tak init`으로 같은 계정 로그인
3. API 키 자동 동기화

## 7. 문제 해결

### 서버가 시작되지 않음

- `.env` 파일이 올바른 위치에 있는지 확인
- Supabase URL과 키가 정확한지 확인
- `npm install`이 모든 폴더(루트, server, frontend)에서 실행되었는지 확인

### API 키가 동기화되지 않음

- 브라우저에서 로그아웃 후 다시 로그인
- Supabase 대시보드에서 RLS 정책이 올바르게 설정되었는지 확인

### 프론트엔드 빌드 오류

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```
