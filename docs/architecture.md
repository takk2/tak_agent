# tak-agent 아키텍처

## 현재 구조

```
[사용자]
  │
  ▼
tak CLI (Node.js)
  │
  ├── utils/config.js        글로벌 설정 (~/.tak-agent/config.json)
  ├── utils/projectContext.js 프로젝트 자동 스캔
  │
  ├── agents/orchestrator.js ──→ Gemini 2.5 Flash
  ├── agents/plannerAgent.js ──→ GPT-4o
  ├── agents/feAgent.js      ──→ Claude Sonnet
  └── agents/qaAgent.js      ──→ Gemini 2.5 Flash
```

각 agent가 클라이언트에서 클라우드 API를 직접 호출하는 구조.  
API 키는 `~/.tak-agent/config.json`에 저장되어 어느 프로젝트에서든 재사용.

---

## 목표 구조

```
[클라이언트들]               [백엔드 서버]           [모델들]

tak CLI        ──┐           ┌─ Orchestrator ──→ Gemini (클라우드)
웹 UI          ──┼──→ API ───┤─ Planner      ──→ Ollama (로컬)
VS Code ext    ──┘           ├─ FE Agent     ──→ Claude (클라우드)
                              └─ QA Agent    ──→ Gemini / Ollama
```

백엔드가 모델 라우터 역할을 담당.  
클라이언트는 백엔드로 요청 하나만 보내고, 어떤 모델을 쓸지는 백엔드가 결정.

---

## 단계별 전환 로드맵

### 1단계 (현재) — CLI 직접 호출
- tak CLI에서 각 클라우드 API 직접 호출
- API 키는 글로벌 config에 저장
- 사용량은 Supabase 또는 로컬 파일에 저장

### 2단계 — Fastify 백엔드 서버 추가
- 현재 `agents/` 폴더를 서비스 레이어로 이식
- tak CLI는 백엔드 서버로 요청만 전송
- API 키는 서버에만 보관
- 여러 기기에서 같은 서버 공유 가능

### 3단계 — 로컬 LLM (Ollama) 도입
- Docker로 Ollama 서버 실행
- 단순 작업(Orchestrator, Planner)은 로컬 모델로 처리 → 비용 절감
- 복잡한 작업(FE Agent)은 클라우드 유지
- 클라우드 장애 시 로컬로 자동 fallback

### 4단계 (선택) — Python 마이크로서비스
- 모델 파인튜닝, Hugging Face 직접 로딩 등 필요 시 추가
- Node 백엔드가 Python 서비스로 요청을 위임하는 방식
- Node 백엔드를 교체하는 게 아닌 별도 서비스로 추가

---

## 모델별 역할 및 전환 계획

| Agent | 현재 모델 | 로컬 전환 가능 여부 | 이유 |
|---|---|---|---|
| Orchestrator | Gemini 2.5 Flash | ✅ 가능 | 단순 분류 작업 |
| Planner | GPT-4o | ✅ 가능 | 자연어 글쓰기 |
| FE Agent | Claude Sonnet | ❌ 클라우드 유지 | 복잡한 코드 생성 |
| QA Agent | Gemini 2.5 Flash | 🔄 부분 가능 | 리뷰 퀄리티 저하 감수 필요 |

---

## 2단계 서버 구성 예시

```
[서버]

Docker Container 1: Ollama
  └── 모델: llama3, mistral 등
  └── API: http://localhost:11434/v1 (OpenAI 호환)

Docker Container 2: Fastify 백엔드
  └── 클라이언트 요청 수신 (REST API)
  └── 모델 라우팅
       ├── 클라우드 API (Claude, GPT, Gemini)
       └── Ollama (localhost:11434)
```

`docker-compose.yml` 예시:

```yaml
services:
  ollama:
    image: ollama/ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama

  backend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - OLLAMA_URL=http://ollama:11434
    depends_on:
      - ollama

volumes:
  ollama_data:
```

---

## Ollama 연동이 쉬운 이유

Ollama가 OpenAI 호환 API를 제공하기 때문에 SDK 교체 없이 `baseURL`만 변경하면 됨.

```javascript
// 클라우드 (현재)
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Ollama로 전환 시
const client = new OpenAI({
  baseURL: "http://localhost:11434/v1",
  apiKey: "ollama",
});
```

---

## 백엔드 전환 시 현재 코드 재사용 범위

| 현재 | 백엔드 전환 후 |
|---|---|
| `index.js` (CLI 진입점) | Fastify 서버 진입점으로 교체 |
| `agents/*.js` | 서비스 레이어로 그대로 이식 |
| `utils/usage.js` | 미들웨어로 그대로 사용 |
| `utils/projectContext.js` | 클라이언트에서 스캔 후 서버로 전송 |
| Supabase 연동 | 그대로 유지 |
