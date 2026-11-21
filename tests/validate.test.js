const { test } = require("node:test");
const assert = require("node:assert/strict");
const { validate, validateActivities } = require("../api/validate.js");

const QUIZ_REQUEST = { count: 1, types: ["객관식"] };

function quizResponse(questions) {
  return { title: "물의 상태 변화", questions };
}

function multipleChoice(overrides = {}) {
  return {
    type: "객관식",
    question: "물이 끓어 기체가 되는 현상은?",
    options: ["증발", "응결", "승화", "융해"],
    answer: 1,
    explanation: "끓는 점에서 일어나는 기화 현상이다.",
    ...overrides,
  };
}

function activity(minutes) {
  return { name: "활동", goal: "목표", steps: ["준비", "진행", "정리"], materials: ["자료"], minutes };
}

test("퀴즈 객관식 문항은 보기가 4개여야 한다", () => {
  const response = quizResponse([multipleChoice({ options: ["증발", "응결", "승화"] })]);
  assert.equal(validate(response, QUIZ_REQUEST), false);
});

test("퀴즈 정답 번호는 1~4 사이여야 한다", () => {
  const response = quizResponse([multipleChoice({ answer: 5 })]);
  assert.equal(validate(response, QUIZ_REQUEST), false);
});

test("퀴즈 정답 번호가 0이면 실패한다", () => {
  const response = quizResponse([multipleChoice({ answer: 0 })]);
  assert.equal(validate(response, QUIZ_REQUEST), false);
});

test("퀴즈 문항 수가 요청한 수와 다르면 실패한다", () => {
  const response = quizResponse([multipleChoice(), multipleChoice()]);
  assert.equal(validate(response, QUIZ_REQUEST), false);
});

test("퀴즈 문항이 기준을 모두 지키면 통과한다", () => {
  assert.equal(validate(quizResponse([multipleChoice()]), QUIZ_REQUEST), true);
});

test("학습활동 추천 활동이 3개가 아니면 실패한다", () => {
  const response = { activities: [activity(10), activity(10)] };
  assert.equal(validateActivities(response, { duration: 40 }), false);
});

test("학습활동 소요 시간 합계가 요청 시간을 넘으면 실패한다", () => {
  const response = { activities: [activity(15), activity(15), activity(15)] };
  assert.equal(validateActivities(response, { duration: 40 }), false);
});

test("학습활동 소요 시간 합계가 요청 시간 이하이면 통과한다", () => {
  const response = { activities: [activity(10), activity(10), activity(10)] };
  assert.equal(validateActivities(response, { duration: 40 }), true);
});

test("학습활동에 필수 항목이 빠지면 실패한다", () => {
  const withoutGoal = { ...activity(10), goal: undefined };
  const response = { activities: [withoutGoal, activity(10), activity(10)] };
  assert.equal(validateActivities(response, { duration: 40 }), false);
});

test("학습활동 추천 개수가 3~5개이면 통과한다", () => {
  const four = { activities: [activity(10), activity(10), activity(10), activity(10)] };
  const five = { activities: [activity(8), activity(8), activity(8), activity(8), activity(8)] };
  assert.equal(validateActivities(four, { duration: 40 }), true);
  assert.equal(validateActivities(five, { duration: 40 }), true);
});

test("학습활동 추천 개수가 5개를 넘으면 실패한다", () => {
  const six = { activities: Array.from({ length: 6 }, () => activity(5)) };
  assert.equal(validateActivities(six, { duration: 40 }), false);
});

test("학습활동 소요 시간 합계가 수업 시간의 90% 미만이면 실패한다", () => {
  const response = { activities: [activity(10), activity(10), activity(10)] };
  assert.equal(validateActivities(response, { duration: 40 }), false);
});

test("학습활동 소요 시간 합계가 수업 시간의 ±10% 안이면 통과한다", () => {
  const response = { activities: [activity(12), activity(12), activity(12)] };
  assert.equal(validateActivities(response, { duration: 40 }), true);
});
