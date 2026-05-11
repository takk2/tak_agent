const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function orchestrator(userRequest, projectContext = null) {
  console.log("\n🎯 Orchestrator: 분석 중...\n");

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const contextSection = projectContext
    ? `\n${projectContext}\n`
    : "";

  const prompt = `
    너는 개발 팀의 오케스트레이터야.
    사용자의 입력이 프론트엔드 개발 작업인지, 일반 대화인지 판단해서 JSON으로 응답해줘.
    ${contextSection}
    요청: ${userRequest}

    --- 개발 작업인 경우 ---
    {
      "type": "task",
      "plan": "전체 계획 요약",
      "tasks": {
        "planner": "기획 에이전트에게 줄 작업",
        "frontend": "FE 에이전트에게 줄 작업",
        "qa": "QA 에이전트에게 줄 작업"
      }
    }

    --- 일반 대화인 경우 ---
    {
      "type": "chat",
      "response": "사용자에게 줄 답변"
    }

    JSON만 응답해줘.
  `;

  const response = await model.generateContent(prompt);
  const responseText = response.response.text();

  const usage = {
    model: "Gemini",
    input: response.response.usageMetadata?.promptTokenCount || 0,
    output: response.response.usageMetadata?.candidatesTokenCount || 0,
  };

  const text = responseText
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  const result = JSON.parse(text);

  if (result.type === "task") {
    console.log(`📋 계획: ${result.plan}\n`);
  }

  return { ...result, usage };
}

module.exports = { orchestrator };

