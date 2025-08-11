// 관리자 페이지
const adminLogin = document.getElementById('adminLogin');
const adminPanel = document.getElementById('adminPanel');
const statsDiv = document.getElementById('stats');
const pdfListDiv = document.getElementById('pdfList');

const ADMIN_PW = 'ahnlabhr0315@'; // 비밀번호 하드코딩

adminLogin.addEventListener('submit', function(e) {
  e.preventDefault();
  const pw = document.getElementById('adminPw').value;
  if(pw === ADMIN_PW) {
    adminPanel.style.display = 'block';
    adminLogin.style.display = 'none';
    loadStats();
    loadPDFList();
  } else {
    alert('비밀번호가 틀렸습니다.');
  }
});

function loadStats() {
  db.collection('responses').get().then(snapshot => {
    const docs = snapshot.docs.map(doc => doc.data());
    const today = new Date().toISOString().slice(0,10);
    const newCount = docs.filter(d => d.type==='신입').length;
    const expCount = docs.filter(d => d.type==='경력').length;
    const todayCount = docs.filter(d => d.date.slice(0,10)===today).length;
    statsDiv.innerHTML = `신입: ${newCount}명<br>경력: ${expCount}명<br>오늘 제출: ${todayCount}명`;
  });
}

function loadPDFList() {
  db.collection('responses').get().then(snapshot => {
    pdfListDiv.innerHTML = '';
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const btn = document.createElement('button');
      btn.textContent = `${data.name} (${data.type}) PDF 다운로드`;
      btn.onclick = () => generatePDF(data);
      pdfListDiv.appendChild(btn);
    });
  });
}

function generatePDF(data) {
  // jsPDF로 PDF 생성
  const doc = new window.jspdf.jsPDF();
  doc.setFont('NotoSansKR', 'normal');
  doc.text(`지원자: ${data.name}\n생년월일: ${data.birth}\n지원유형: ${data.type}\n제출일: ${data.date.slice(0,10)}`, 10, 20);
  doc.text('서술형 답변:', 10, 40);
  data.essays.forEach((ans, i) => {
    doc.text(`${i+1}. ${ans}`, 10, 50 + i*10);
  });
  doc.text('선택형 답변:', 10, 80);
  data.selects.forEach((ans, i) => {
    doc.text(`${i+1}. ${ans}`, 10, 90 + i*5);
  });
  doc.save(`${data.name}_${data.type}_응답.pdf`);
}

// jsPDF CDN 추가
const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
document.head.appendChild(script);
