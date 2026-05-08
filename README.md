# tak-agent

말로 설명하면 AI가 React 코드를 만들어주는 도구입니다.

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

### 3. API 키 입력

`.env.example` 파일을 복사해서 `.env` 파일을 만들고, 키를 입력합니다.

```bash
cp .env.example .env
```

`.env` 파일을 열면 이렇게 생겼습니다:

```
ANTHROPIC_API_KEY=   ← Claude 키 입력
GEMINI_API_KEY=      ← Gemini 키 입력
OPENAI_API_KEY=      ← OpenAI 키 입력
```

> API 키가 없다면?
> - Claude: https://console.anthropic.com
> - Gemini: https://aistudio.google.com/apikey
> - OpenAI: https://platform.openai.com/api-keys

### 4. 어디서든 쓸 수 있게 등록

```bash
npm link
```

---

## 사용하기

### 코드 만들기 — `tak start`

코드를 넣고 싶은 프로젝트 폴더로 이동한 다음 실행합니다.

```bash
cd ~/내-프로젝트
tak start
```

그러면 이렇게 나옵니다:

```
어떤 기능을 만들까요?
>
```

원하는 기능을 말로 입력하면 됩니다:

```
> 로그인 폼 만들어줘
> 상품 목록 카드 컴포넌트 만들어줘
> 다크모드 토글 버튼 만들어줘
```

완료되면 현재 폴더 안에 파일이 자동으로 생성됩니다.

---

### 질문하기 — `tak chat`

코드 생성 없이 AI에게 개발 관련 질문을 할 수 있습니다.
어떤 폴더에서 실행해도 상관없습니다.

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

## 코드 스타일 바꾸기

`context/` 폴더 안의 파일을 수정하면 AI가 만들어주는 코드 스타일이 바뀝니다.

| 파일 | 설명 |
|---|---|
| `react-components.md` | 컴포넌트 구조나 이름 짓는 방식 |
| `styled-components.md` | 스타일 작성 방식 |
| `agent-discipline.md` | 코드 수정 범위나 원칙 |

---

## 잘 안 될 때

**`tak` 명령어를 찾을 수 없다고 나올 때**
```bash
npm link
```
다시 실행해보세요.

**API 오류가 날 때**
`.env` 파일에 키가 제대로 입력되어 있는지 확인해보세요.
