const scoreLabels = {
  persona_quality: "역할 설정",
  question_quality_stage2: "2단계 질문",
  question_quality_stage3: "3단계 질문",
  originality: "자기 언어화"
};

const scoreMaxValues = {
  persona_quality: 10,
  question_quality_stage2: 10,
  question_quality_stage3: 10,
  originality: 70
};

const rationaleLabels = {
  actual_level: "실제 수준",
  persona_quality: "역할 설정",
  question_quality_stage2: "2단계 질문",
  question_quality_stage3: "3단계 질문",
  originality: "자기 언어화"
};

const feedbackLabels = {
  opening: "칭찬으로 시작",
  persona_comment: "역할 설정 피드백",
  question_comment: "질문 피드백",
  originality_comment: "자기 언어화 피드백",
  closing: "마무리"
};

const $ = (selector) => document.querySelector(selector);

const jsonInput = $("#jsonInput");
const errorMessage = $("#errorMessage");
const report = $("#report");
const fileInput = $("#fileInput");

$("#clearBtn").addEventListener("click", () => {
  jsonInput.value = "";
  errorMessage.textContent = "";
  fileInput.value = "";
  report.classList.add("hidden");
});

$("#pasteBtn").addEventListener("click", async () => {
  try {
    const clipboardText = await navigator.clipboard.readText();
    jsonInput.value = clipboardText;
    errorMessage.textContent = "";
  } catch (error) {
    errorMessage.textContent = "브라우저에서 클립보드 접근을 허용한 뒤 다시 눌러 주세요.";
  }
});

fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    jsonInput.value = String(reader.result || "");
    errorMessage.textContent = "";
    fileInput.value = "";
  });
  reader.addEventListener("error", () => {
    errorMessage.textContent = "파일을 읽지 못했습니다. JSON 파일인지 확인해 주세요.";
  });
  reader.readAsText(file);
});

$("#renderBtn").addEventListener("click", () => {
  try {
    const parsed = JSON.parse(jsonInput.value);
    renderReport(parsed);
  } catch (error) {
    report.classList.add("hidden");
    errorMessage.textContent = "JSON 형식을 확인해 주세요. 쉼표, 따옴표, 중괄호가 빠지지 않았는지 점검하면 좋습니다.";
  }
});

function renderReport(data) {
  errorMessage.textContent = "";
  report.classList.remove("hidden");

  $("#assignedLevel").textContent = `${safe(data.assigned_level)}단계`;
  $("#levelNote").textContent = safe(data.level_gap?.gap_note);

  $("#levelGap").textContent = formatGap(data.level_gap?.gap);
  $("#tiebreaker").textContent = data.tiebreaker != null ? `${Math.round(data.tiebreaker * 100)}%` : "-";
  $("#status").textContent = data.status === "success" ? "성공" : safe(data.status);
  $("#errorStatus").textContent = data.error_message || "오류 없이 정상 처리되었습니다.";

  renderScores(data.scores || {});
  renderRationales(data.teacher_rationale || {});
  renderFeedback(data.feedback_korean || {});

  report.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderScores(scores) {
  const scoreList = $("#scoreList");
  scoreList.innerHTML = "";
  let total = 0;
  let maxTotal = 0;

  Object.entries(scores).forEach(([key, value]) => {
    const max = scoreMaxValues[key] || 10;
    const numericValue = Number(value);
    const percent = Number.isFinite(numericValue) ? clamp((numericValue / max) * 100, 0, 100) : 0;
    const unit = ` / ${max}`;

    if (Number.isFinite(numericValue)) {
      total += numericValue;
      maxTotal += max;
    }

    const item = document.createElement("div");
    item.className = "score-item";
    item.innerHTML = `
      <div class="score-top">
        <span class="score-name">${scoreLabels[key] || key}</span>
        <span class="score-value">${safe(value)}${unit}</span>
      </div>
      <div class="bar" aria-hidden="true">
        <div class="bar-fill" style="width: ${percent}%"></div>
      </div>
    `;
    scoreList.appendChild(item);
  });

  const totalItem = document.createElement("div");
  totalItem.className = "total-score";
  totalItem.innerHTML = `
    <span>총점</span>
    <strong>${maxTotal ? `${formatScore(total)} / ${maxTotal}` : "-"}</strong>
  `;
  scoreList.appendChild(totalItem);
}

function renderRationales(rationales) {
  const rationaleList = $("#rationaleList");
  rationaleList.innerHTML = "";

  Object.entries(rationaleLabels).forEach(([key, label]) => {
    if (!rationales[key]) return;

    const item = document.createElement("div");
    item.className = "rationale-item";
    item.innerHTML = `
      <h3>${label}</h3>
      <p>${escapeHtml(rationales[key])}</p>
    `;
    rationaleList.appendChild(item);
  });
}

function renderFeedback(feedback) {
  const feedbackList = $("#feedbackList");
  feedbackList.innerHTML = "";

  Object.entries(feedbackLabels).forEach(([key, label]) => {
    if (!feedback[key]) return;

    const item = document.createElement("div");
    item.className = "feedback-item";
    item.innerHTML = `
      <h3>${label}</h3>
      <p>${escapeHtml(feedback[key])}</p>
    `;
    feedbackList.appendChild(item);
  });
}

function safe(value) {
  return value ?? "-";
}

function formatGap(gap) {
  if (gap == null) return "-";
  if (gap === 0) return "차이 없음";
  return gap > 0 ? `+${gap}단계` : `${gap}단계`;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatScore(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
