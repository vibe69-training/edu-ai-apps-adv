const fs = require("node:fs");
const path = require("node:path");
const { OpenAI } = require("openai");
const { validate, validateActivities } = require("./validate.js");

const SYSTEM_PROMPT = fs.readFileSync(path.join(__dirname, "시스템 프롬프트.txt"), "utf8");
const TIMEOUT_MS = 30000;
const QUIZ_FIELDS = ["subject", "grade", "topic", "count", "questionType", "passage"];
const ACTIVITY_FIELDS = ["subject", "grade", "goal", "minutes", "traits", "format", "groupSize"];

function fail(status, error) {
  return { status, body: { error } };
}

function pick(source, keys) {
  return Object.fromEntries(keys.filter((key) => source[key] !== undefined).map((key) => [key, source[key]]));
}

function parseJson(text) {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(cleaned);
}

async function requestAi(type, input) {
  const { AI_ENDPOINT, AI_API_KEY, AI_DEPLOYMENT } = process.env;
  if (!AI_ENDPOINT || !AI_API_KEY || !AI_DEPLOYMENT) throw new Error("AI 설정이 없습니다");

  const client = new OpenAI({ baseURL: AI_ENDPOINT, apiKey: AI_API_KEY, timeout: TIMEOUT_MS });
  const completion = await client.chat.completions.create({
    model: AI_DEPLOYMENT,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `type: ${type}\n${JSON.stringify(input)}` },
    ],
  });
  return parseJson(completion.choices[0].message.content);
}

async function quiz(input) {
  const count = Number(input.count);
  if (!Number.isInteger(count) || count < 1 || count > 20) return fail(400, "문항 수는 1~20이어야 합니다");

  const data = await requestAi("quiz", pick(input, QUIZ_FIELDS));
  if (!validate(data, { count, types: [input.questionType] })) {
    return fail(422, "퀴즈 문항이 검증을 통과하지 못했습니다");
  }
  return { status: 200, body: { type: "quiz", items: data.questions } };
}

async function activity(input) {
  const minutes = Number(input.minutes);
  if (!Number.isInteger(minutes) || minutes < 10 || minutes > 120) return fail(400, "수업 시간은 10~120분이어야 합니다");

  const data = await requestAi("activity", pick(input, ACTIVITY_FIELDS));
  if (!validateActivities(data, { duration: minutes })) {
    return fail(422, "학습활동이 검증을 통과하지 못했습니다");
  }
  if (input.format && data.activities.some((item) => item.format !== input.format)) {
    return fail(422, "학습활동이 검증을 통과하지 못했습니다");
  }
  return { status: 200, body: { type: "activity", items: data.activities } };
}

async function generate(body) {
  if (!body || typeof body !== "object") return fail(400, "요청 본문이 없습니다");
  const input = body.input && typeof body.input === "object" ? body.input : body;

  try {
    if (body.type === "quiz") return await quiz(input);
    if (body.type === "activity") return await activity(input);
    return fail(400, "type은 quiz 또는 activity여야 합니다");
  } catch (error) {
    if (error.message === "AI 설정이 없습니다") return fail(500, error.message);
    return fail(500, "AI 응답을 받지 못했습니다");
  }
}

module.exports = { generate };
