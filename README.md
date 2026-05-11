# tak-agent

말로 설명하면 AI가 React 코드를 만들어주는 도구입니다.  
실행한 프로젝트의 구조와 규칙을 자동으로 파악해서, 그 프로젝트에 맞는 코드를 생성합니다.

---

## 설치하기

### 1. 이 폴더를 받아서 열기

```bash
git clone https://github.com/your-username/tak-agent.git
cd tak-agent
```

### 2. 필요한 것들 설치

```bash
npm install
```

### 3. 어디서든 쓸 수 있게 등록

```bash
npm link
```

### 4. API 키 설정 (최초 1회)

```bash
tak init
```

실행하면 안내에 따라 API 키를 입력합니다. 키는 `~/.tak-agent/config.json`에 저장되고, 이후 어떤 프로젝트에서 실행해도 자동으로 불러옵니다.

```
[1/6] Anthropic API Key (Claude)
미설정 (엔터로 건너뜀)
> sk-ant-...

[2/6] Google API Key (Gemini)
미설정 (엔터로 건너뜀)
> AIza...

...

[4/6] Supabase URL (선택사항, 엔터로 건너뜀)
[5/6] Supabase Publishable Key (선택사항, 엔터로 건너뜀)
[6/6] 디바이스 이름 (선택사항, 엔터로 건너뜀)
```

> API 키 발급처:
> - Claude: https://console.anthropic.com
> - Gemini: https://aistudio.google.com/apikey
> - OpenAI: https://platform.openai.com/api-keys

---

## 사용하기

### 코드 만들기 — `tak dev`

코드를 넣고 싶은 프로젝트 폴더로 이동한 다음 실행합니다.

```bash
cd ~/내-프로젝트
tak dev
```

실행하면 프로젝트를 자동으로 스캔합니다:

```
╔════════════════════════════════╗
║     🤖 TAK AI 팀 준비 완료!     ║
║          ⚙️  개발 모드           ║
╚════════════════════════════════╝

📁 작업 경로: /Users/me/my-nextjs-project
🔍 프로젝트 감지: package.json (47개 의존성), .cursorrules, tsconfig.json, src/ 구조

어떤 기능을 만들까요?
>
```

원하는 기능을 말로 입력하면 됩니다:

```
> 로그인 폼 만들어줘
> 상품 목록 카드 컴포넌트 만들어줘
> 다크모드 토글 버튼 만들어줘
```

AI가 프로젝트의 기술 스택, 디렉토리 구조, 코딩 컨벤션을 파악한 뒤 알맞은 위치에 파일을 생성합니다.

---

### 질문하기 — `tak chat`

코드 생성 없이 AI에게 개발 관련 질문을 할 수 있습니다.

```bash
tak chat
```

실행하면 먼저 대화할 AI를 고릅니다:

```
어떤 AI와 대화할까요?
1. Claude
2. Gemini
3. GPT
> 1

✅ Claude와 대화를 시작합니다. (종료: exit)

무엇이든 물어보세요!
> React랑 Next.js 차이가 뭐야?
> styled-components 어떻게 쓰는 거야?
> 이 에러 왜 나는 거야?
```

---

### 사용 비용 확인 — `tak --usage`

지금까지 얼마나 썼는지 확인합니다.

```bash
tak --usage
```

---

## 프로젝트 규칙 설정

프로젝트 루트에 아래 파일 중 하나를 만들어두면 AI가 자동으로 읽어서 반영합니다.

| 파일 | 설명 |
|---|---|
| `CLAUDE.md` | 프로젝트 전용 AI 규칙 |
| `AGENTS.md` | 에이전트 행동 지침 |
| `.cursorrules` | Cursor 스타일 규칙 |

파일이 없어도 `package.json`, `tsconfig.json`, 디렉토리 구조를 자동으로 파악합니다.

### tak-agent 기본 코드 스타일

프로젝트 규칙이 없을 경우 `context/` 폴더의 기본 규칙을 사용합니다.

| 파일 | 설명 |
|---|---|
| `react-components.md` | 컴포넌트 구조, 이름 짓는 방식 |
| `styled-components.md` | 스타일 작성 방식 |
| `agent-discipline.md` | 코드 수정 범위나 원칙 |

---

## 잘 안 될 때

**`tak` 명령어를 찾을 수 없다고 나올 때**
```bash
npm link
```
다시 실행해보세요.

**API 키 오류가 날 때**
```bash
tak init
```
를 다시 실행해서 키를 확인해주세요.

**특정 프로젝트에서만 다른 키를 쓰고 싶을 때**  
프로젝트 루트에 `.env` 파일을 만들면 글로벌 설정보다 우선 적용됩니다.
