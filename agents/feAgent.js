const Anthropic = require("@anthropic-ai/sdk");
const fs = require("fs");
const path = require("path");

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function loadAgentRules(includeGenericRules = true) {
  const contextDir = path.join(__dirname, "../context");

  const alwaysLoad = ["agent-discipline.md"];
  const genericRules = ["react-components.md", "styled-components.md"];

  const files = includeGenericRules ? [...alwaysLoad, ...genericRules] : alwaysLoad;

  return files
    .map((file) => {
      const filePath = path.join(contextDir, file);
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, "utf-8");
      }
      return "";
    })
    .filter(Boolean)
    .join("\n\n");
}

async function feAgent(task, plannerResult, projectContext = null) {
  console.log("⚛️  FE Agent: 코드 생성 중...\n");

  // 프로젝트 컨텍스트가 있으면 일반 규칙 대신 프로젝트 규칙 사용
  const agentRules = loadAgentRules(!projectContext);
  const contextSection = projectContext ? `\n${projectContext}\n` : "";

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    betas: ["prompt-caching-2024-07-31"],
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `너는 시니어 React/TypeScript 프론트엔드 개발자야.
아래 규칙을 반드시 따라서 코드를 작성해줘.

=== 에이전트 규칙 ===
${agentRules}
${contextSection}
=== 출력 규칙 (반드시 지켜줘) ===
- 각 파일을 아래 형식으로 반드시 출력해줘.
- 파일 경로는 코드 블록 첫 줄에 주석으로 반드시 포함해야 해.
- 형식을 절대 바꾸지 마.

\`\`\`tsx
// src/components/LoginForm/LoginForm.tsx
[코드 내용]
\`\`\`

\`\`\`ts
// src/components/LoginForm/styled.ts
[코드 내용]
\`\`\``,
            cache_control: { type: "ephemeral" },
          },
          {
            type: "text",
            text: `=== 기획 내용 ===
${plannerResult}

=== 작업 ===
${task}`,
          },
        ],
      },
    ],
  });

  const cacheReadTokens = response.usage.cache_read_input_tokens || 0;
  const cacheWriteTokens = response.usage.cache_creation_input_tokens || 0;

  if (cacheReadTokens > 0) {
    console.log("⚡ 캐시 히트 (context 재사용)\n");
  }

  const usage = {
    model: "Claude",
    input: response.usage.input_tokens,
    output: response.usage.output_tokens,
    cacheRead: cacheReadTokens,
    cacheWrite: cacheWriteTokens,
  };

  const result = response.content[0].text;
  console.log("⚛️  FE Agent 완료 ✅\n");
  return { result, usage };
}

module.exports = { feAgent };

