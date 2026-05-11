const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function plannerAgent(task, projectContext = null) {
  console.log("📋 기획 Agent: 구조 설계 중...\n");

  const contextSection = projectContext
    ? `\n${projectContext}\n`
    : "";

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: `
          너는 시니어 기획자야.
          아래 작업을 기반으로 상세 기획을 작성해줘.
          ${contextSection}
          작업: ${task}
          
          아래 항목을 포함해줘:
          - 기능 목록
          - 유저 플로우
          - 필요한 컴포넌트 목록 (프로젝트 구조에 맞는 경로 포함)
          - API 엔드포인트 목록
        `,
      },
    ],
  });

  const usage = {
    model: "GPT",
    input: response.usage.prompt_tokens,
    output: response.usage.completion_tokens,
  };

  const result = response.choices[0].message.content;
  console.log("📋 기획 Agent 완료 ✅\n");
  return { result, usage };
}

module.exports = { plannerAgent };

