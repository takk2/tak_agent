const { GoogleGenerativeAI } = require("@google/generative-ai");
const Anthropic = require("@anthropic-ai/sdk");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const QA_PROMPT = (task, feResult) => `
  너는 시니어 QA 엔지니어야.
  아래 코드를 리뷰하고 문제점과 개선사항을 알려줘.
  
  작업: ${task}
  코드: ${feResult}
  
  아래 항목을 체크해줘:
  - 버그 가능성
  - 예외 처리 누락
  - 모바일 대응
  - 접근성
  - 성능 이슈
`;

async function qaAgentGemini(task, feResult) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(QA_PROMPT(task, feResult));
  const text = result.response.text();

  return {
    result: text,
    usage: {
      model: "Gemini",
      input: result.response.usageMetadata?.promptTokenCount ?? 0,
      output: result.response.usageMetadata?.candidatesTokenCount ?? 0,
    },
  };
}

async function qaAgentClaude(task, feResult) {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: QA_PROMPT(task, feResult) }],
  });

  return {
    result: response.content[0].text,
    usage: {
      model: "Claude",
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
    },
  };
}

async function qaAgent(task, feResult) {
  console.log("✅ QA Agent: 코드 리뷰 중...\n");

  try {
    const response = await qaAgentGemini(task, feResult);
    console.log("✅ QA Agent 완료 ✅ (Gemini)\n");
    return response;
  } catch (error) {
    console.log(`⚠️  Gemini 실패 (${error.message.slice(0, 50)}...)`);
    console.log("🔄 Claude로 재시도 중...\n");
    const response = await qaAgentClaude(task, feResult);
    console.log("✅ QA Agent 완료 ✅ (Claude fallback)\n");
    return response;
  }
}

module.exports = { qaAgent };
