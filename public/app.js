const form = document.getElementById("input-form");
const result = document.getElementById("result");
const submitButton = form.querySelector("button.primary");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!checkForm(form)) return;

  const data = Object.fromEntries(new FormData(form));
  const body = { type: form.dataset.kind, input: { ...data, questionType: data.type } };

  submitButton.disabled = true;
  result.replaceChildren(statusMessage("만드는 중입니다"));
  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await response.json();
    if (!response.ok) {
      result.replaceChildren(errorMessage(json.error));
      return;
    }
    result.replaceChildren(resultView(form.dataset.kind, json.items));
  } catch {
    result.replaceChildren(errorMessage("서버에 연결할 수 없습니다. npm start로 서버를 실행하세요."));
  } finally {
    submitButton.disabled = false;
  }
});

function statusMessage(text) {
  const p = document.createElement("p");
  p.className = "empty";
  p.setAttribute("role", "status");
  p.textContent = text;
  return p;
}

function errorMessage(text) {
  const p = document.createElement("p");
  p.className = "field-error";
  p.setAttribute("role", "alert");
  p.textContent = `오류: ${text}`;
  return p;
}

function quizCards(items) {
  const wrapper = document.createElement("div");
  wrapper.className = "cards";

  items.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "card";

    const title = document.createElement("h3");
    title.textContent = `문항 ${index + 1}`;

    const question = document.createElement("p");
    question.textContent = item.question;

    const hasOptions = Array.isArray(item.options);
    const choices = document.createElement("ol");
    choices.className = "choices";
    for (const option of hasOptions ? item.options : []) {
      const li = document.createElement("li");
      li.textContent = option;
      choices.append(li);
    }

    const answer = document.createElement("details");
    answer.className = "answer";
    const summary = document.createElement("summary");
    summary.textContent = "정답 보기";
    const explanation = document.createElement("p");
    const answerText = hasOptions ? `${item.answer}번 ${item.options[item.answer - 1]}` : `${item.answer}`;
    explanation.textContent = `정답: ${answerText}. ${item.explanation}`;
    answer.append(summary, explanation);

    card.append(title, question, ...(hasOptions ? [choices] : []), answer);
    wrapper.append(card);
  });

  return wrapper;
}

const ACTIVITY_HEADER = ["활동 이름", "목적", "권장 시간", "준비물", "진행 단계", "결과물", "이해도 점검 방법"];

function resultView(kind, items) {
  const container = document.createElement("div");

  const tools = document.createElement("div");
  tools.className = "result-tools";
  const status = document.createElement("span");
  status.setAttribute("role", "status");

  const csvLabel = kind === "quiz" ? "CSV 내려받기" : "엑셀(CSV) 내려받기";
  const csvButton = toolButton(csvLabel, () => (kind === "quiz" ? downloadQuizCsv(items) : downloadActivityCsv(items)));
  const copyButton = toolButton("전체 복사", () => copyText(kind === "quiz" ? quizText(items) : activityText(items), status));

  tools.append(csvButton, copyButton, status);
  const cards = kind === "quiz" ? quizCards(items) : activityCards(items);
  container.append(tools, cards);
  return container;
}

function toolButton(label, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "tool";
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

async function copyText(text, status) {
  try {
    await navigator.clipboard.writeText(text);
    status.textContent = "복사됨";
  } catch {
    status.textContent = "복사하지 못했습니다";
  }
  setTimeout(() => {
    status.textContent = "";
  }, 2000);
}

function answerLabel(item) {
  return Array.isArray(item.options) ? `${item.answer}번 ${item.options[item.answer - 1]}` : `${item.answer}`;
}

function stepsText(item) {
  return item.steps.map((step, index) => `${index + 1}단계: ${step}`).join(" / ");
}

function activityRow(item) {
  // 결과물과 이해도 점검 방법은 학습활동 응답에 없어 빈 칸으로 둔다.
  return [item.name, item.goal, `${item.minutes}분`, item.materials.join(", "), stepsText(item), "", ""];
}

function quizText(items) {
  const lines = [`${document.getElementById("topic").value} 퀴즈`, ""];
  items.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.question}`);
    (Array.isArray(item.options) ? item.options : []).forEach((option, i) => lines.push(`${"①②③④"[i]} ${option}`));
    lines.push(`정답: ${answerLabel(item)}`, `해설: ${item.explanation}`, "");
  });
  return lines.join("\n").trimEnd();
}

function activityText(items) {
  return items
    .map((item) => activityRow(item).map((value, i) => `${ACTIVITY_HEADER[i]}: ${value}`).join("\n"))
    .join("\n\n");
}

function downloadCsv(filename, header, rows) {
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(","))
    .join("\r\n");

  // UTF-8 BOM so Excel reads Korean text correctly.
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadQuizCsv(items) {
  const header = ["번호", "질문", "보기 ①", "보기 ②", "보기 ③", "보기 ④", "정답", "해설"];
  const rows = items.map((item, index) => {
    const options = Array.isArray(item.options) ? item.options : [];
    return [index + 1, item.question, options[0], options[1], options[2], options[3], answerLabel(item), item.explanation];
  });
  downloadCsv("quiz.csv", header, rows);
}

function downloadActivityCsv(items) {
  downloadCsv("activity.csv", ACTIVITY_HEADER, items.map(activityRow));
}

function activityCards(items) {
  const wrapper = document.createElement("div");
  wrapper.className = "cards";

  for (const item of items) {
    const card = document.createElement("article");
    card.className = "card";

    const title = document.createElement("h3");
    title.textContent = item.name;

    const list = document.createElement("dl");
    list.className = "result-card";
    const rows = [
      ["목표", item.goal],
      ["준비물", item.materials.join(", ")],
      ["진행 단계", stepsText(item)],
      ["시간", `${item.minutes}분`],
    ];
    for (const [term, value] of rows) {
      const dt = document.createElement("dt");
      dt.textContent = term;
      const dd = document.createElement("dd");
      dd.textContent = value;
      list.append(dt, dd);
    }

    card.append(title, list);
    wrapper.append(card);
  }

  return wrapper;
}

