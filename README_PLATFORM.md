# TAK Agent Platform

AI 개발 어시스턴트 플랫폼 - 웹 기반 멀티유저 지원

## 🎯 주요 기능

- **멀티유저 플랫폼**: Supabase Auth 기반 회원가입/로그인
- **클라우드 설정 동기화**: API 키와 설정이 모든 디바이스에 자동 동기화
- **웹 UI**: React 기반 모던 웹 인터페이스
- **CLI 지원**: 터미널에서도 사용 가능
- **사용량 추적**: 유저별/디바이스별 토큰 사용량 관리

## 🚀 빠른 시작

### 설치

```bash
npm install
cd server && npm install && cd ..
cd frontend && npm install && cd ..
```

### Supabase 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. `docs/supabase-schema.md`의 SQL 실행
3. `.env` 파일에 Supabase 정보 추가

### 초기 설정

```bash
tak init  # 웹 브라우저에서 설정
```

## 📖 사용법

### CLI 모드

```bash
# 개발 모드 (코드 생성)
tak dev

# 채팅 모드
tak chat

# 사용량 조회
tak --usage
```

### 웹 모드

```bash
# 서버 시작
cd server && npm start

# 브라우저에서 http://localhost:3000 접속
```

## 📂 프로젝트 구조

```
tak_agent/
├── index.js           # CLI 진입점
├── agents/            # AI Agent 로직
├── utils/             # 유틸리티
├── server/            # Fastify 백엔드
│   ├── index.js
│   └── routes/
│       ├── auth.js    # 인증 API
│       └── config.js  # 설정 API
└── frontend/          # React 프론트엔드
    ├── src/
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Signup.jsx
    │   │   └── Settings.jsx
    │   └── App.jsx
    └── package.json
```

## 🔧 개발

### 서버 개발 모드

```bash
cd server
npm run dev  # --watch 모드로 자동 재시작
```

### 프론트엔드 개발 모드

```bash
cd frontend
npm run dev  # http://localhost:5173
```

## 📚 문서

- [설치 및 설정 가이드](./docs/setup.md)
- [Supabase 스키마](./docs/supabase-schema.md)
- [아키텍처 설계](./docs/architecture.md)

## 🔐 보안

- API 키는 Supabase에 암호화 저장 권장
- RLS (Row Level Security)로 사용자 데이터 격리
- 클라이언트 측에서 민감 정보 노출 방지

## 🛣️ 로드맵

현재: **1단계 - CLI 직접 호출** ✅  
진행 중: **2단계 - 웹 플랫폼 + 백엔드 서버**  
다음: **3단계 - 로컬 LLM (Ollama) 도입**

자세한 로드맵은 [architecture.md](./docs/architecture.md) 참조.

## 📄 라이센스

ISC
