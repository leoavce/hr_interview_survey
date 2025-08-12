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

  // 방어: auth/db가 없으면 콘솔에 표시하고 로그인 폼 유지
  if (!(window.firebase && window.auth && window.db)) {
    console.error('Firebase 초기화가 이루어지지 않았습니다. 스크립트 순서를 확인하세요 (firebase-init.js → admin.js).');
    // 로그인 폼은 기본 보임 상태라 추가 조치는 없음
    return;
  }

  // 로그인 상태 감시
  auth.onAuthStateChanged((user) => {
    try {
      // 익명 또는 미로그인 → 로그인폼
      if (!user || user.isAnonymous || !user.email) {
        adminPanel.style.display = 'none';
        loginForm.style.display = 'block';
        return;
      }

      // 이메일/비번 로그인 사용자만 관리자 접근 허용
      loginForm.style.display = 'none';
      adminPanel.style.display = 'block';
      loadStatsAndList().catch((e) => {
        console.error(e);
        alert('응답 목록을 불러오지 못했습니다: ' + (e.message || e));
      });
    } catch (e) {
      console.error('onAuthStateChanged 오류', e);
      adminPanel.style.display = 'none';
      loginForm.style.display = 'block';
    }
  });

  // 로그인
  loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.style.display = 'none';
  const email = document.getElementById('adminEmail').value.trim();
  const pw = document.getElementById('adminPw').value;

  try {
    const cred = firebase.auth.EmailAuthProvider.credential(email, pw);
    const cu = auth.currentUser;

    // 익명 세션이면 업그레이드(링크), 아니면 일반 로그인
    if (cu && cu.isAnonymous) {
      await cu.linkWithCredential(cred);
    } else {
      await auth.signInWithEmailAndPassword(email, pw);
    }
  } catch (err) {
    console.error(err);
    loginError.textContent = err.message || '로그인 실패';
    loginError.style.display = 'block';
  }
});

  // 로그아웃
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => auth.signOut());
  }

  function todayISO(){
    const d = new Date();
    const y = d.getFullYear();
    const m = ('0'+(d.getMonth()+1)).slice(-2);
    const day = ('0'+d.getDate()).slice(-2);
    return `${y}-${m}-${day}`;
  }
  function escapeHtml(s){
    return String(s||'').replace(/[&<>"']/g,(m)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  async function loadStatsAndList() {
    // 관리자 페이지는 익명로그인이 필요없지만, Firebase 준비 대기는 재사용
    if (typeof ensureFirebaseReady === 'function') {
      try { await ensureFirebaseReady(); } catch(_) {}
    }

    const snap = await db.collection('responses').orderBy('date','desc').get();
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    const today = todayISO();
    totalCountEl.textContent = docs.length;
    newCountEl.textContent = docs.filter(d => d.type === '신입').length;
    expCountEl.textContent = docs.filter(d => d.type === '경력').length;
    todayCountEl.textContent = docs.filter(d => (d.date||'').slice(0,10) === today).length;

    listEl.innerHTML = docs.map(doc => {
      const when = doc.date ? new Date(doc.date).toLocaleString('ko-KR') : '-';
      // Storage OFF이면 업로드 대신 'PDF 생성(다운로드)'로 동작
      const canViewUrl = window.USE_STORAGE && doc.pdfUrl;
      const btnHtml = canViewUrl
        ? `<a class="btn small" href="${doc.pdfUrl}" target="_blank" rel="noopener">PDF</a>`
        : `<button class="btn small outline" data-generate="${doc.id}">${window.USE_STORAGE ? 'PDF 업로드' : 'PDF 생성'}</button>`;

      return `
        <div class="row item">
          <div class="col">
            <div class="name">${escapeHtml(doc.name)} <span class="muted">(${escapeHtml(doc.birth)})</span></div>
            <div class="meta">${when} · <span class="badge small">${escapeHtml(doc.type)}</span> · 결과: ${escapeHtml(doc.resultType||'')}</div>
          </div>
          <div class="col actions">
            ${btnHtml}
          </div>
        </div>
      `;
    }).join('');

    // PDF 버튼(생성/업로드) 이벤트
    listEl.querySelectorAll('button[data-generate]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-generate');
        const doc = docs.find(d => d.id === id);
        if (!doc) return;

        const old = btn.textContent;
        btn.disabled = true; btn.textContent = '생성 중...';
        try {
          const blob = await generatePdfFromDoc(doc);

          if (window.USE_STORAGE) {
            const fileName = `응답_${doc.name}_${doc.type}_${Date.now()}.pdf`;
            const storageRef = storage.ref().child(`pdfs/${fileName}`);
            await storageRef.put(blob, { contentType: 'application/pdf' });
            const pdfUrl = await storageRef.getDownloadURL();
            await db.collection('responses').doc(id).update({ pdfUrl });
            await loadStatsAndList();
          } else {
            // 업로드 없이 즉시 다운로드
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `응답_${doc.name}_${doc.type}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
          }
        } catch (e) {
          alert('PDF 생성 실패: ' + (e.message || e));
        } finally {
          btn.textContent = old;
          btn.disabled = false;
        }
      });
    });
  }

  // 관리자 측 PDF 생성
  async function generatePdfFromDoc(data) {
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
        <div><strong>유형 결과:</strong> ${escapeHtml(data.resultType||'')} (A:${data.typeScores?.A||0}, B:${data.typeScores?.B||0}, C:${data.typeScores?.C||0}, D:${data.typeScores?.D||0})</div>
      </div>
      <hr style="margin:12px 0;">
      <div style="font-size:12px;">
        <h3 style="margin:12px 0 6px 0;">서술형 답변</h3>
        ${(data.essays||[]).map((t,i)=>`<div style="margin-bottom:8px;"><strong>${i+1}.</strong> ${escapeHtml(t)}</div>`).join('')}
        <h3 style="margin:12px 0 6px 0;">선택형 결과(1~40)</h3>
        <div>${(data.selects||[]).map((v,i)=>`${i+1}:${v===1?'①':'②'}`).join(' · ')}</div>
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
})();

