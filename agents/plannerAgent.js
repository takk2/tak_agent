const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function plannerAgent(task) {
  console.log("📋 기획 Agent: 구조 설계 중...\n");

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
    너는 시니어 기획자야.
    아래 작업을 기반으로 상세 기획을 작성해줘.
    
    작업: ${task}
    
    아래 항목을 포함해줘:
    - 기능 목록
    - 유저 플로우
    - 필요한 컴포넌트 목록
    - API 엔드포인트 목록
  `;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  console.log("📋 기획 Agent 완료 ✅\n");
  return text;
}

module.exports = { plannerAgent };
