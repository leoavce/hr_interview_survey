// js/admin.js
(function () {
  const loginForm = document.getElementById('adminLogin');
  const adminPanel = document.getElementById('adminPanel');
  const loginError = document.getElementById('loginError');

  const totalCountEl = document.getElementById('totalCount');
  const newCountEl = document.getElementById('newCount');
  const expCountEl = document.getElementById('expCount');
  const todayCountEl = document.getElementById('todayCount');
  const listEl = document.getElementById('list');

  const logoutBtn = document.getElementById('logoutBtn');

  // 로그인 상태 감시
  auth.onAuthStateChanged((user) => {
    if (user) {
      loginForm.style.display = 'none';
      adminPanel.style.display = 'block';
      loadStatsAndList();
    } else {
      adminPanel.style.display = 'none';
      loginForm.style.display = 'block';
    }
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.style.display = 'none';
    const email = document.getElementById('adminEmail').value.trim();
    const pw = document.getElementById('adminPw').value;
    try {
      await auth.signInWithEmailAndPassword(email, pw);
    } catch (err) {
      loginError.textContent = err.message || '로그인 실패';
      loginError.style.display = 'block';
    }
  });

  logoutBtn.addEventListener('click', () => auth.signOut());

  async function loadStatsAndList() {
    const snap = await db.collection('responses').orderBy('date','desc').get();
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    const today = todayISO();
    const total = docs.length;
    const newCount = docs.filter(d => d.type === '신입').length;
    const expCount = docs.filter(d => d.type === '경력').length;
    const todayCount = docs.filter(d => (d.date||'').slice(0,10) === today).length;

    totalCountEl.textContent = total;
    newCountEl.textContent = newCount;
    expCountEl.textContent = expCount;
    todayCountEl.textContent = todayCount;

    listEl.innerHTML = docs.map(doc => {
      const when = new Date(doc.date).toLocaleString('ko-KR');
      const pdfBtn = doc.pdfUrl
        ? `<a class="btn small" href="${doc.pdfUrl}" target="_blank" rel="noopener">PDF</a>`
        : `<button class="btn small outline" data-generate="${doc.id}">PDF 생성</button>`;
      return `
        <div class="row item">
          <div class="col">
            <div class="name">${doc.name} <span class="muted">(${doc.birth})</span></div>
            <div class="meta">${when} · <span class="badge small">${doc.type}</span> · 결과: ${doc.resultType}</div>
          </div>
          <div class="col actions">
            ${pdfBtn}
          </div>
        </div>
      `;
    }).join('');

    // 생성 버튼 이벤트
    listEl.querySelectorAll('button[data-generate]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-generate');
        const doc = docs.find(d => d.id === id);
        if (!doc) return;
        try {
          btn.disabled = true;
          btn.textContent = '생성 중...';
          const blob = await generatePdfFromDoc(doc);
          const fileName = `응답_${doc.name}_${doc.type}_${Date.now()}.pdf`;
          const storageRef = storage.ref().child(`pdfs/${fileName}`);
          await storageRef.put(blob, { contentType: 'application/pdf' });
          const pdfUrl = await storageRef.getDownloadURL();
          await db.collection('responses').doc(id).update({ pdfUrl });
          await loadStatsAndList(); // 새로고침
        } catch (e) {
          alert('PDF 생성 실패: ' + (e.message || e));
        }
      });
    });
  }

  // 관리자에서도 동일한 방식으로 이미지 기반 PDF 생성
  async function generatePdfFromDoc(data) {
    // 임시 컨테이너
    const temp = document.createElement('div');
    temp.style.position = 'absolute';
    temp.style.left = '-9999px';
    temp.style.top = '-9999px';
    temp.style.width = '794px';
    temp.style.padding = '32px';
    temp.style.background = '#fff';
    temp.innerHTML = `
      <h2 style="margin:0 0 12px 0;">AhnLab 채용 응답서</h2>
      <div style="font-size:14px; line-height:1.6;">
        <div><strong>이름:</strong> ${escapeHtml(data.name)}</div>
        <div><strong>생년월일:</strong> ${escapeHtml(data.birth)}</div>
        <div><strong>지원유형:</strong> ${escapeHtml(data.type)}</div>
        <div><strong>제출일:</strong> ${(data.date||'').slice(0,10)}</div>
        <div><strong>유형 결과:</strong> ${escapeHtml(data.resultType)} (A:${data.typeScores?.A||0}, B:${data.typeScores?.B||0}, C:${data.typeScores?.C||0}, D:${data.typeScores?.D||0})</div>
      </div>
      <hr style="margin:12px 0;">
      <div style="font-size:12px;">
        <h3 style="margin:12px 0 6px 0;">서술형 답변</h3>
        ${data.essays.map((t,i)=>`<div style="margin-bottom:8px;"><strong>${i+1}.</strong> ${escapeHtml(t)}</div>`).join('')}
        <h3 style="margin:12px 0 6px 0;">선택형 결과(1~40)</h3>
        <div>${data.selects.map((v,i)=>`${i+1}:${v===1?'①':'②'}`).join(' · ')}</div>
      </div>
    `;
    document.body.appendChild(temp);

    const canvas = await html2canvas(temp, { scale: 2, backgroundColor: '#fff' });
    document.body.removeChild(temp);

    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgWidth = pageWidth - 40;
    const ratio = canvas.height / canvas.width;
    const imgHeight = imgWidth * ratio;
    pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight);
    return pdf.output('blob');
  }

  function escapeHtml(s){
    return String(s||'').replace(/[&<>"']/g,(m)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

})();
