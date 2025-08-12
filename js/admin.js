(function () {
  // Firebase 준비 확인 (admin은 이메일/비번 로그인이므로 ensureFirebaseReady 호출 불필요)
  if (!window.firebase || !window.auth || !window.db) {
    console.error("Firebase 초기화가 이루어지지 않았습니다. 스크립트 순서를 확인하세요 (firebase-init.js → admin.js).");
  }

  const adminAuth = window.auth;
  const adminDb = window.db;
  const useStorage = !!window.USE_STORAGE;
  const storageRefRoot = window.storage ? window.storage.ref() : null;

  // DOM
  const loginForm = document.getElementById('adminLogin');
  const adminPanel = document.getElementById('adminPanel');
  const loginError = document.getElementById('loginError');

  const totalCountEl = document.getElementById('totalCount');
  const newCountEl = document.getElementById('newCount');
  const expCountEl = document.getElementById('expCount');
  const todayCountEl = document.getElementById('todayCount');
  const listEl = document.getElementById('list');
  const logoutBtn = document.getElementById('logoutBtn');

  const storageFlagLabel = document.getElementById('storageFlagLabel');
  storageFlagLabel.textContent = useStorage ? 'ON' : 'OFF';

  // 로그인 상태 감시 + 실시간 구독 핸들
  let unsubscribe = null;

  adminAuth.onAuthStateChanged((user) => {
    if (user) {
      // 로그인 UI 숨김, 패널 표시
      loginForm.style.display = 'none';
      adminPanel.style.display = 'block';

      // 실시간 구독 시작
      unsubscribe && unsubscribe();
      unsubscribe = watchResponses();
    } else {
      // 구독 정리 & UI 토글
      unsubscribe && unsubscribe();
      unsubscribe = null;
      adminPanel.style.display = 'none';
      loginForm.style.display = 'block';
      // 로그인 폼 초기화
      loginError.style.display = 'none';
    }
  });

  // 로그인 처리
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.style.display = 'none';
    const email = document.getElementById('adminEmail').value.trim();
    const pw = document.getElementById('adminPw').value;

    try {
      // 동일 브라우저에서 설문(익명) 세션이 잡혀 있으면 먼저 정리 (세션 충돌 방지)
      const u = adminAuth.currentUser;
      if (u && u.isAnonymous) {
        await adminAuth.signOut();
      }

      await adminAuth.signInWithEmailAndPassword(email, pw);
      // 성공 → onAuthStateChanged가 패널 전환/구독 수행
    } catch (err) {
      // 이미 사용중 오류 등
      loginError.textContent = err && err.message ? err.message : '로그인 실패';
      loginError.style.display = 'block';
    }
  });

  // 로그아웃
  logoutBtn.addEventListener('click', () => adminAuth.signOut());

  // === 실시간 구독 ===
  function watchResponses() {
    return adminDb
      .collection('responses')
      .orderBy('date', 'desc')
      .onSnapshot((snap) => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderStatsAndList(docs);
      }, (err) => {
        console.error('실시간 구독 오류:', err);
      });
  }

  // ===== 렌더링 =====
  function renderStatsAndList(docs) {
    const today = todayISO();
    const total = docs.length;
    const newCount = docs.filter(d => d.type === '신입').length;
    const expCount = docs.filter(d => d.type === '경력').length;
    const todayCount = docs.filter(d => (d.date||'').slice(0,10) === today).length;

    totalCountEl.textContent = total;
    newCountEl.textContent = newCount;
    expCountEl.textContent = expCount;
    todayCountEl.textContent = todayCount;

    if (!docs.length) {
      listEl.innerHTML = `<div class="muted">응답 데이터가 없습니다.</div>`;
      return;
    }

    listEl.innerHTML = docs.map(doc => {
      const when = doc.date ? new Date(doc.date).toLocaleString('ko-KR') : '-';
      // Storage OFF이면 업로드 버튼 대신 "로컬 PDF 다운로드" 버튼 제공
      const pdfControls = (() => {
        if (doc.pdfUrl) {
          return `<a class="btn small" href="${doc.pdfUrl}" target="_blank" rel="noopener">PDF 열기</a>`;
        }
        if (useStorage) {
          return `<button class="btn small outline" data-generate-upload="${doc.id}">PDF 업로드</button>`;
        }
        // 저장소 OFF → 로컬 다운로드
        return `<button class="btn small outline" data-generate-download="${doc.id}">PDF 다운로드</button>`;
      })();

      const scores = doc.typeScores || {};
      return `
        <div class="row item">
          <div class="col">
            <div class="name">${escapeHtml(doc.name)} <span class="muted">(${escapeHtml(doc.birth||'')})</span></div>
            <div class="meta">
              ${when} · <span class="badge small">${escapeHtml(doc.type||'-')}</span>
              · 결과: ${escapeHtml(doc.resultType||'-')}
              · 점수: A:${scores.A||0} B:${scores.B||0} C:${scores.C||0} D:${scores.D||0}
            </div>
          </div>
          <div class="col actions">
            ${pdfControls}
          </div>
        </div>
      `;
    }).join('');

    // 이벤트 바인딩
    if (useStorage) {
      listEl.querySelectorAll('button[data-generate-upload]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-generate-upload');
          const doc = docs.find(d => d.id === id);
          if (!doc) return;
          try {
            btn.disabled = true;
            const originalText = btn.textContent;
            btn.textContent = '생성/업로드 중...';

            const blob = await generatePdfFromDoc(doc);
            const fileName = `응답_${doc.name}_${doc.type}_${Date.now()}.pdf`;
            const ref = storageRefRoot.child(`pdfs/${fileName}`);
            await ref.put(blob, { contentType: 'application/pdf' });
            const pdfUrl = await ref.getDownloadURL();
            await adminDb.collection('responses').doc(id).update({ pdfUrl });
            // 업로드 후 UI는 실시간 구독으로 자동 반영
          } catch (e) {
            alert('PDF 업로드 실패: ' + (e.message || e));
          } finally {
            btn.disabled = false;
            btn.textContent = 'PDF 업로드';
          }
        });
      });
    } else {
      // 로컬 다운로드
      listEl.querySelectorAll('button[data-generate-download]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-generate-download');
          const doc = docs.find(d => d.id === id);
          if (!doc) return;
          try {
            btn.disabled = true;
            const originalText = btn.textContent;
            btn.textContent = 'PDF 생성 중...';

            const blob = await generatePdfFromDoc(doc);
            const fileName = `응답_${doc.name}_${doc.type}_${Date.now()}.pdf`;

            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(a.href);
            document.body.removeChild(a);
          } catch (e) {
            alert('PDF 생성 실패: ' + (e.message || e));
          } finally {
            btn.disabled = false;
            btn.textContent = 'PDF 다운로드';
          }
        });
      });
    }
  }

  // ===== PDF 생성 (이미지 캡처 → jsPDF) =====
  async function generatePdfFromDoc(data) {
    // 임시 캔버스 컨테이너
    const temp = document.createElement('div');
    temp.style.position = 'absolute';
    temp.style.left = '-9999px';
    temp.style.top = '-9999px';
    temp.style.width = '794px';  // A4 폭 기준(96DPI)
    temp.style.padding = '32px';
    temp.style.background = '#fff';
    temp.innerHTML = `
      <h2 style="margin:0 0 12px 0;">AhnLab 채용 응답서</h2>
      <div style="font-size:14px; line-height:1.6;">
        <div><strong>이름:</strong> ${escapeHtml(data.name)}</div>
        <div><strong>생년월일:</strong> ${escapeHtml(data.birth||'')}</div>
        <div><strong>지원유형:</strong> ${escapeHtml(data.type||'')}</div>
        <div><strong>제출일:</strong> ${(data.date||'').slice(0,10)}</div>
        <div><strong>유형 결과:</strong> ${escapeHtml(data.resultType||'-')} (A:${data.typeScores?.A||0}, B:${data.typeScores?.B||0}, C:${data.typeScores?.C||0}, D:${data.typeScores?.D||0})</div>
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
    const imgWidth = pageWidth - 40;   // 20pt padding
    const ratio = canvas.height / canvas.width;
    const imgHeight = imgWidth * ratio;

    pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight);
    return pdf.output('blob');
  }

  // ===== 유틸 =====
  function todayISO() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,'0');
    const da = String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${da}`;
  }
  function escapeHtml(s){
    return String(s||'').replace(/[&<>"']/g,(m)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }
})();
