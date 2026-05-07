const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function qaAgent(task, feResult) {
  console.log("✅ QA Agent: 코드 리뷰 중...\n");

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
    너는 시니어 QA 엔지니어야.
    아래 코드를 리뷰하고 문제점과 개선사항을 알려줘.
    
    작업: ${task}
    
    코드:
    ${feResult}
    
    아래 항목을 체크해줘:
    - 버그 가능성
    - 예외 처리 누락
    - 모바일 대응
    - 접근성
    - 성능 이슈
  `;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  console.log("✅ QA Agent 완료 ✅\n");
  return text;
}

module.exports = { qaAgent };
