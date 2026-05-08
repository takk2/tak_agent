const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const messages = [];

async function chat(userInput) {
  messages.push({ role: "user", content: userInput });

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: "너는 친절한 개발 어시스턴트야. 자유롭게 대화하고 개발 관련 질문에 답해줘.",
    messages,
  });

  const reply = response.content[0].text;
  messages.push({ role: "assistant", content: reply });

  const usage = {
    model: "Claude",
    input: response.usage.input_tokens,
    output: response.usage.output_tokens,
  };

  return { reply, usage };
}

module.exports = { chat };
