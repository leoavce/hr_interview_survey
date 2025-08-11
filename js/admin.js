// assets/js/admin.js

// 관리자 페이지 스크립트(강화)
// - 비밀번호 하드코딩 로그인 유지(추후 Firebase Auth로 승격 가능)
// - Firestore에서 responses 집계/목록 로드
// - 오늘 집계는 KST 기준으로 계산                                 // 수정됨
// - PDF 버튼: 클라이언트(jsPDF)로 재생성 가능 (간단 템플릿)        // 수정됨

(function () {
  const adminLogin = document.getElementById("adminLogin");
  const adminPanel = document.getElementById("adminPanel");
  const statsDiv = document.getElementById("stats");
  const pdfListDiv = document.getElementById("pdfList");

  const ADMIN_PW = "ahnlabhr0315@"; // 기존 하드코딩 유지

  // jsPDF 로드 (CDN)  // 수정됨
  (function ensureJsPDF() {
    const id = "jspdf-cdn";
    if (document.getElementById(id)) return;
    const s = document.createElement("script");
    s.id = id;
    s.src =
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    document.head.appendChild(s);
  })();

  adminLogin?.addEventListener("submit", function (e) {
    e.preventDefault();
    const pw = document.getElementById("adminPw").value;
    if (pw === ADMIN_PW) {
      adminPanel.style.display = "block";
      adminLogin.style.display = "none";
      loadStats();
      loadPDFList();
    } else {
      alert("비밀번호가 틀렸습니다.");
    }
  });

  async function loadStats() {
    const snap = await db.collection("responses").get();
    const docs = snap.docs.map((d) => d.data());

    const todayStr = todayKSTString(); // YYYY-MM-DD (KST)  // 수정됨
    const newCount = docs.filter((d) => d.type === "신입").length;
    const expCount = docs.filter((d) => d.type === "경력").length;

    // date는 ISO 저장, 앞 10자리 비교
    const todayCount = docs.filter((d) => (d.date || "").slice(0, 10) === todayStr)
      .length;

    statsDiv.innerHTML = `신입: ${newCount}명<br>경력: ${expCount}명<br>오늘 제출(KST): ${todayCount}명`;
  }

  async function loadPDFList() {
    const snap = await db.collection("responses").orderBy("date", "desc").get();
    pdfListDiv.innerHTML = "";
    snap.docs.forEach((doc) => {
      const data = doc.data();
      const btn = document.createElement("button");
      btn.textContent = `${data.name} (${data.type}) PDF 다운로드`;
      btn.onclick = () => generatePDF(data);
      pdfListDiv.appendChild(btn);
    });
  }

  // 간단 PDF (서술형/선택형 요약 + 점수표)  // 수정됨
  function generatePDF(data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const line = (y) => doc.line(10, y, 200, y);

    doc.setFontSize(14);
    doc.text("AhnLab 설문 응답서", 10, 15);
    line(18);

    doc.setFontSize(11);
    doc.text(`지원자: ${data.name}`, 10, 28);
    doc.text(`생년월일: ${data.birth}`, 10, 36);
    doc.text(`유형: ${data.type}`, 10, 44);
    doc.text(`제출일: ${(data.date || "").slice(0, 10)}`, 10, 52);

    let y = 64;
    doc.setFontSize(12);
    doc.text("서술형 요약", 10, y);
    y += 6;
    doc.setFontSize(10);
    (data.essays || []).forEach((ans, i) => {
      const lines = doc.splitTextToSize(`${i + 1}. ${ans}`, 185);
      doc.text(lines, 10, y);
      y += lines.length * 5 + 2;
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });

    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(12);
    doc.text("선택형 요약", 10, y);
    y += 6;
    doc.setFontSize(10);

    const scores = data.typeScores || { A: 0, B: 0, C: 0, D: 0 };
    const resultType = data.resultType || "";
    doc.text(
      `A:${scores.A}  B:${scores.B}  C:${scores.C}  D:${scores.D}  → 결과: ${resultType}`,
      10,
      y
    );
    y += 10;

    doc.save(`${data.name}_${data.type}_응답.pdf`);
  }
})();
