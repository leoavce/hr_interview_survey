// assets/js/survey.js

// 설문 페이지 스크립트(전면 개편)
// - 로컬스토리지에서 사용자 기본정보 로드
// - 신입/경력별 서술형 + 공통 선택형 40쌍 렌더
// - 선택형 결과로 A/B/C/D 점수 계산 및 유형 결정 (파이썬 로직 이식)  // 수정됨
// - Firestore 저장 스키마 통일 및 서버 타임스탬프 저장               // 수정됨
// - 제출 전 강력 검증 + 미응답 스크롤 이동                             // 수정됨

(function () {
  const surveyForm = document.getElementById("surveyForm");
  const questionsDiv = document.getElementById("questions");
  const titleEl = document.getElementById("surveyTitle");

  // 지원자 기본정보 (index -> localStorage)
  const type = localStorage.getItem("applyType"); // "신입" | "경력"
  const name = localStorage.getItem("applyName") || "";
  const birth = localStorage.getItem("applyBirth") || "";

  // ===== 유효성 검사 유틸 =====
  function isValidBirthDateISO(v) {
    // 입력은 YYYY-MM-DD (input[type=date]) 기준
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
    const [y, m, d] = v.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    const now = new Date();
    if (y < 1900 || y > now.getFullYear()) return false;
    // 실제 존재하는 날짜인지
    if (
      dt.getFullYear() !== y ||
      dt.getMonth() + 1 !== m ||
      dt.getDate() !== d
    )
      return false;
    // 미래 금지
    if (dt > now) return false;
    return true;
  }

  // ===== 신입/경력 서술형 질문 =====
  const essayQuestions = {
    신입: [
      "신입 지원 동기를 서술하세요.",
      "본인의 강점은 무엇인가요?",
    ],
    경력: [
      "경력 지원 동기를 서술하세요.",
      "이전 직무에서의 주요 성과를 서술하세요.",
    ],
  };

  // ===== 선택형 40쌍 (공통) =====
  const selectQuestions = Array.from(
    { length: 40 },
    (_, i) => `선택형 질문 ${i + 1}`
  );

  // ===== A/B/C/D 유형 분류 맵 (파이썬 로직 이식) =====  // 수정됨
  const MAP = {
    A: [1, 7, 9, 13, 17, 24, 26, 32, 33, 39, 41, 48, 50, 53, 57, 63, 65, 70, 74, 79],
    B: [2, 8, 10, 14, 18, 23, 25, 30, 34, 37, 42, 47, 51, 55, 58, 62, 66, 69, 75, 77],
    C: [4, 5, 12, 16, 19, 22, 27, 29, 36, 38, 43, 46, 49, 56, 59, 64, 68, 72, 76, 80],
    D: [3, 6, 11, 15, 20, 21, 28, 31, 35, 40, 44, 45, 52, 54, 60, 61, 67, 71, 73, 78],
  };

  function getTypeScores(answers40) {
    const scores = { A: 0, B: 0, C: 0, D: 0 };
    answers40.forEach((ans, i) => {
      const q = ans === "1" ? i * 2 + 1 : i * 2 + 2; // "1" or "2"
      for (const k of Object.keys(MAP)) {
        if (MAP[k].includes(q)) {
          scores[k]++;
          break;
        }
      }
    });
    return scores;
  }
  function decideType(scores) {
    const order = ["A", "B", "C", "D"];
    const max = Math.max(...Object.values(scores));
    const top = order.find((k) => scores[k] === max);
    return `${top}형 (${scores[top]}개)`;
  }

  // ===== 렌더링 =====
  function renderQuestions() {
    // 서술형
    essayQuestions[type].forEach((q, idx) => {
      const label = document.createElement("label");
      label.textContent = q;
      const textarea = document.createElement("textarea");
      textarea.name = `essay${idx + 1}`;
      textarea.required = true;
      questionsDiv.appendChild(label);
      questionsDiv.appendChild(textarea);
    });

    // 선택형 (값을 "1" / "2"로 저장하도록 변경)  // 수정됨
    selectQuestions.forEach((q, idx) => {
      const div = document.createElement("div");
      div.className = "choice-block"; // 스타일용
      div.innerHTML = `
        <div class="choice-title">${idx + 1}. ${q}</div>
        <div class="choice-options">
          <label class="choice-opt"><input type="radio" name="select${idx + 1}" value="1" required> 선택지 1</label>
          <label class="choice-opt"><input type="radio" name="select${idx + 1}" value="2"> 선택지 2</label>
        </div>
      `;
      questionsDiv.appendChild(div);
    });
  }

  // ===== 초기 세팅 =====
  if (!surveyForm || !questionsDiv) return;

  if (!type || !name || !birth) {
    alert("이전 페이지에서 정보를 다시 입력해 주세요.");
    window.location.href = "./index.html";
    return;
  }

  if (!["신입", "경력"].includes(type)) {
    alert("지원 유형이 올바르지 않습니다.");
    window.location.href = "./index.html";
    return;
  }

  if (!isValidBirthDateISO(birth)) {
    alert("생년월일 형식이 올바르지 않습니다.");
    window.location.href = "./index.html";
    return;
  }

  titleEl.textContent = `${type} 설문 응답`;
  renderQuestions();

  // ===== 제출 =====
  surveyForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    // 응답 수집
    const data = {
      type,
      name,
      birth,
      essays: [],
      selects: [],
      date: new Date().toISOString(),
      createdAt: serverTS ? serverTS() : null, // 서버 타임스탬프  // 수정됨
    };

    // 서술형
    try {
      essayQuestions[type].forEach((_, idx) => {
        const v = (surveyForm[`essay${idx + 1}`]?.value || "").trim();
        if (!v) throw new Error(`서술형 ${idx + 1}번을 입력해 주세요.`);
        data.essays.push(v);
      });
    } catch (err) {
      alert(err.message);
      return;
    }

    // 선택형(미응답 스크롤 안내)  // 수정됨
    for (let i = 0; i < selectQuestions.length; i++) {
      const val = surveyForm[`select${i + 1}`]?.value;
      if (!val) {
        const block = surveyForm.querySelector(
          `.choice-block:nth-of-type(${i + essayQuestions[type].length + 1})`
        );
        block?.scrollIntoView({ behavior: "smooth", block: "center" });
        alert(`선택형 ${i + 1}번에 응답해 주세요.`);
        return;
      }
      data.selects.push(val); // "1" 또는 "2"
    }

    // 유형 점수/결정 추가  // 수정됨
    const scores = getTypeScores(data.selects);
    const resultType = decideType(scores);
    data.typeScores = scores;
    data.resultType = resultType;

    // 제출 직후 사용자 피드백
    alert(
      `제출 요약\n- A:${scores.A} B:${scores.B} C:${scores.C} D:${scores.D}\n- 결과: ${resultType}`
    );

    // Firestore 저장
    try {
      await db.collection("responses").add(data);
      // 완료 페이지 이동
      window.location.href = "./complete.html";
    } catch (err) {
      console.error(err);
      alert("저장에 실패했습니다. 네트워크 상태를 확인해 주세요.");
    }
  });
})();
