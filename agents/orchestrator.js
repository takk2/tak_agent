const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function orchestrator(userRequest) {
  console.log("\n🎯 Orchestrator: 작업 분석 중...\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `
          너는 개발 팀의 오케스트레이터야.
          아래 요청을 분석해서 JSON 형식으로 작업을 분배해줘.
          
          요청: ${userRequest}
          
          응답 형식:
          {
            "plan": "전체 계획 요약",
            "tasks": {
              "planner": "기획 에이전트에게 줄 작업",
              "frontend": "FE 에이전트에게 줄 작업",
              "qa": "QA 에이전트에게 줄 작업"
            }
          }
          
          JSON만 응답해줘.
        `,
      },
    ],
  });

  const usage = {
    model: "Claude",
    input: response.usage.input_tokens,
    output: response.usage.output_tokens,
  };

  const text = response.content[0].text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  const result = JSON.parse(text);

  console.log(`📋 계획: ${result.plan}\n`);
  return { ...result, usage };
}

module.exports = { orchestrator };
