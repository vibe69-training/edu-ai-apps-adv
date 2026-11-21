// api/validate.js
function validate(response, request) {
  // response: { title, questions }, request: { count, types }
  // 문항 수·객관식 보기 4개·정답 번호 1~4 등을 검사해 통과하면 true, 아니면 false
  if (!response || !Array.isArray(response.questions)) return false;
  if (response.questions.length !== request.count) return false;
  return response.questions.every((q) => {
    if (!q || typeof q.question !== "string" || q.question.trim() === "") return false;
    if (q.type === "객관식" || Array.isArray(q.options)) {
      return Array.isArray(q.options) && q.options.length === 4 && Number.isInteger(q.answer) && q.answer >= 1 && q.answer <= 4;
    }
    return typeof q.answer === "string" && q.answer.trim() !== "";
  });
}
function validateActivities(response, request) {
  // response: { activities }, request: { duration }
  // 활동 3~5개, 단계 3~5개, 필수 항목 포함, 시간 합계가 요청 시간의 ±10% 안이면 true, 아니면 false
  if (!response || !Array.isArray(response.activities)) return false;
  const required = ["name", "goal", "steps", "materials", "minutes"];
  const { activities } = response;
  if (activities.length < 3 || activities.length > 5) return false;
  const complete = activities.every((a) => a && required.every((key) => a[key] !== undefined && a[key] !== null));
  if (!complete) return false;
  const stepsOk = activities.every((a) => Array.isArray(a.steps) && a.steps.length >= 3 && a.steps.length <= 5);
  const total = activities.reduce((sum, a) => sum + a.minutes, 0);
  return stepsOk && Math.abs(total - request.duration) * 10 <= request.duration;
}
module.exports = { validate, validateActivities };
