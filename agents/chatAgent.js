const Anthropic = require("@anthropic-ai/sdk");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const OpenAI = require("openai");

const SYSTEM_PROMPT = "너는 친절한 개발 어시스턴트야. 자유롭게 대화하고 개발 관련 질문에 답해줘.";

const models = {
  claude: {
    label: "Claude",
    async chat(messages, userInput) {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const history = [...messages, { role: "user", content: userInput }];
      const response = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: history,
      });
      const reply = response.content[0].text;
      return {
        reply,
        updatedMessages: [...history, { role: "assistant", content: reply }],
        usage: { model: "Claude", input: response.usage.input_tokens, output: response.usage.output_tokens },
      };
    },
  },

  gemini: {
    label: "Gemini",
    async chat(messages, userInput) {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: SYSTEM_PROMPT,
      });

      const history = messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const chatSession = model.startChat({ history });
      const result = await chatSession.sendMessage(userInput);
      const reply = result.response.text();

      return {
        reply,
        updatedMessages: [...messages, { role: "user", content: userInput }, { role: "assistant", content: reply }],
        usage: {
          model: "Gemini",
          input: result.response.usageMetadata?.promptTokenCount ?? 0,
          output: result.response.usageMetadata?.candidatesTokenCount ?? 0,
        },
      };
    },
  },

  gpt: {
    label: "GPT",
    async chat(messages, userInput) {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const history = [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })),
        { role: "user", content: userInput },
      ];
      const response = await client.chat.completions.create({
        model: "gpt-4o",
        messages: history,
      });
      const reply = response.choices[0].message.content;

      return {
        reply,
        updatedMessages: [...messages, { role: "user", content: userInput }, { role: "assistant", content: reply }],
        usage: { model: "GPT", input: response.usage.prompt_tokens, output: response.usage.completion_tokens },
      };
    },
  },
};

module.exports = { models };
