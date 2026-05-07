const Anthropic = require("@anthropic-ai/sdk");
const fs = require("fs");
const path = require("path");

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function loadRules() {
  const contextDir = path.join(__dirname, "../context");
  const files = [
    "agent-discipline.md",
    "react-components.md",
    "styled-components.md",
  ];

  return files
    .map((file) => {
      const filePath = path.join(contextDir, file);
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, "utf-8");
      }
      return "";
    })
    .join("\n\n");
}

async function feAgent(task, plannerResult) {
  console.log("⚛️  FE Agent: 코드 생성 중...\n");

  const rules = loadRules();

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `
          너는 시니어 React/TypeScript 프론트엔드 개발자야.
          아래 규칙을 반드시 따라서 코드를 작성해줘.
          
          === 코드 규칙 ===
          ${rules}
          
          === 기획 내용 ===
          ${plannerResult}
          
          === 작업 ===
          ${task}
          
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
          \`\`\`
        `,
      },
    ],
  });

  const usage = {
    model: "Claude",
    input: response.usage.input_tokens,
    output: response.usage.output_tokens,
  };

  const result = response.content[0].text;
  console.log("⚛️  FE Agent 완료 ✅\n");
  return { result, usage };
}

module.exports = { feAgent };
