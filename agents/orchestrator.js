const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function orchestrator(userRequest) {
  console.log("\n🎯 Orchestrator: 작업 분석 중...\n");

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
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
    
    JSON만 응답해줘. 마크다운 코드블록 없이 순수 JSON만.
  `;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const parsed = JSON.parse(text);

  console.log(`📋 계획: ${parsed.plan}\n`);
  return parsed;
}

module.exports = { orchestrator };
