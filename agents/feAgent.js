const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const rules = loadRules();

  const prompt = `
    너는 시니어 React/TypeScript 프론트엔드 개발자야.
    아래 규칙을 반드시 따라서 코드를 작성해줘.
    
    === 코드 규칙 ===
    ${rules}
    
    === 기획 내용 ===
    ${plannerResult}
    
    === 작업 ===
    ${task}
  `;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  console.log("⚛️  FE Agent 완료 ✅\n");
  return text;
}

module.exports = { feAgent };
