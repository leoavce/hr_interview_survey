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

  // Firebase 준비 보장
  (async () => {
    try {
      await ensureFirebaseReady();
    } catch (e) {
      console.warn('Firebase 준비 실패:', e);
    }
  })();

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

  // 이메일/비번 로그인
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

  // 목록/통계
  async function loadStatsAndList() {
    const snap = await db.collection('responses').orderBy('date','desc').get();
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    const today = new Date().toISOString().slice(0,10);
    totalCountEl.textContent = docs.length;
    newCountEl.textContent = docs.filter(d => d.type === '신입').length;
    expCountEl.textContent = docs.filter(d => d.type === '경력').length;
    todayCountEl.textContent = docs.filter(d => (d.date||'').slice(0,10) === today).length;

    listEl.innerHTML = docs.map(doc => {
      const when = new Date(doc.date).toLocaleString('ko-KR');
      const pdfBtn = `<button class="btn small" data-generate="${doc.id}">PDF 생성/다운</button>`;
      return `
        <div class="row item">
          <div class="col">
            <div class="name">${escapeHtml(doc.name)} <span class="muted">(${escapeHtml(doc.birth)})</span></div>
            <div class="meta">${when} · <span class="badge small">${escapeHtml(doc.type)}</span> · 결과: ${escapeHtml(doc.resultType||'')}</div>
          </div>
          <div class="col actions">
            ${pdfBtn}
          </div>
        </div>
      `;
    }).join('');

    // PDF 생성
    listEl.querySelectorAll('button[data-generate]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-generate');
        const doc = docs.find(d => d.id === id);
        if (!doc) return;
        try {
          btn.disabled = true;
          btn.textContent = '생성 중...';
          const blob = await generatePdfFromDoc(doc);
          // 관리자 로컬 다운로드(저장소 업로드 없이)
          const a = document.createElement('a');
          const url = URL.createObjectURL(blob);
          a.href = url;
          a.download = `AhnLab_응답_${doc.type}_${doc.name}_${doc.birth}.pdf`;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            URL.revokeObjectURL(url);
            a.remove();
          }, 0);
          btn.textContent = 'PDF 생성/다운';
        } catch (e) {
          alert('PDF 생성 실패: ' + (e.message || e));
          btn.textContent = 'PDF 생성/다운';
        } finally {
          btn.disabled = false;
        }
      });
    });
  }

  // ============== PDF ==============
  async function generatePdfFromDoc(data) {
    // 컨테이너
    const wrap = document.createElement('div');
    wrap.style.position = 'absolute';
    wrap.style.left = '-9999px';
    wrap.style.top = '-9999px';
    wrap.style.width = '794px';  // A4(가로 px 기준)
    wrap.style.background = '#fff';
    wrap.style.padding = '28px';

    const headRight = `
      <div style="position:absolute; right:28px; top:28px; font-size:14px; line-height:1.8;">
        <div>면접일자 : __________________</div>
        <div>작성자 : ____________________</div>
      </div>
    `;

    if (data.type === '신입') {
      const f = data.form || {};
      wrap.innerHTML = `
        <div style="position:relative; min-height:60px;">
          <h2 style="margin:0 0 6px 0; font-size:24px;">신입사원  면접 사전 질문지</h2>
          ${headRight}
        </div>

        <div style="font-size:14px; margin:4px 0 16px 0;">
          이름: <strong>${escapeHtml(data.name)}</strong> &nbsp;&nbsp;|&nbsp;&nbsp;
          생년월일: <strong>${escapeHtml(data.birth)}</strong>
        </div>

        <ol style="font-size:14px; line-height:1.7; padding-left:18px; margin:0;">
          <li style="margin-bottom:10px;">
            안랩에서 꿈꾸는 미래 포부 (희망하는 역할/목표)에 대해서 말씀해 주십시오.<br>
            <div style="white-space:pre-wrap; margin-top:6px;">${escapeHtml(f.dream||'')}</div>
          </li>

          <li style="margin-bottom:10px;">
            본인이 다른 사람과 구별되는 특별히 뛰어난 점이 있다면 최대 3가지(1가지여도 무방함) 소개해 주십시오.
            <div style="white-space:pre-wrap; margin-top:6px;">
              ① ${escapeHtml((f.strengths||[])[0]||'')}<br>
              ② ${escapeHtml((f.strengths||[])[1]||'')}<br>
              ③ ${escapeHtml((f.strengths||[])[2]||'')}
            </div>
          </li>

          <li style="margin-bottom:10px;">
            살아오면서 성취한 것 중 타인에게 자랑할 만한 것을 3가지 소개해 주십시오.
            <div style="white-space:pre-wrap; margin-top:6px;">
              ① ${escapeHtml((f.achievements||[])[0]||'')}<br>
              ② ${escapeHtml((f.achievements||[])[1]||'')}<br>
              ③ ${escapeHtml((f.achievements||[])[2]||'')}
            </div>
          </li>

          <li style="margin-bottom:10px;">
            지원 직무(부문)에서 성과를 내기 위해 필요한 역량이 무엇이라고 생각하시는지 기술해 주십시오.
            <div style="white-space:pre-wrap; margin-top:6px;">● 필요역량 : ${escapeHtml(f.competency?.needed||'')}</div>
            <div>● 본인의 역량 보유 수준 : ${Number(f.competency?.score||0)} 점 / 10점 만점</div>
            <div style="white-space:pre-wrap;">● 필요 역량을 갖추기 위한 과정(노력) : ${escapeHtml(f.competency?.effort||'')}</div>
          </li>

          <li style="margin-bottom:10px;">
            타인이 인정(칭찬)하는 본인 성격(성향)상의 장점과 그 이유를 기술해주십시오.<br>
            <div style="white-space:pre-wrap; margin-top:6px;">${escapeHtml(f.personalityStrength||'')}</div>
          </li>

          <li style="margin-bottom:10px;">
            다음 보기 중에서 안랩 근무를 통해서 기대하는 것을 중요한 순서대로 나열해 주십시오.
            <div style="margin:6px 0; font-size:13px;">보기) 업무 외 개인시간, 연봉, 승진(지위), 인간관계, 업무성취, 자기개발</div>
            <div>① ${escapeHtml((f.expectations||[])[0]||'')} &nbsp; ② ${escapeHtml((f.expectations||[])[1]||'')} &nbsp; ③ ${escapeHtml((f.expectations||[])[2]||'')}</div>
            <div>④ ${escapeHtml((f.expectations||[])[3]||'')} &nbsp; ⑤ ${escapeHtml((f.expectations||[])[4]||'')} &nbsp; ⑥ ${escapeHtml((f.expectations||[])[5]||'')}</div>
          </li>

          <li style="margin-bottom:10px;">
            안랩 외에 현재 최종면접이 진행중이거나 합격한 회사가 있습니까?<br>
            <div style="white-space:pre-wrap; margin-top:6px;">${escapeHtml(f.otherOffers||'')}</div>
          </li>

          <li style="margin-bottom:10px;">
            희망연봉은?<br>
            <div style="margin-top:6px;">최저 ${Number(f.salary?.min||0)} (만원) ~ 최고 ${Number(f.salary?.max||0)} (만원)</div>
          </li>
        </ol>

        <hr style="margin:12px 0;">
        <div style="font-size:13px;">※ 설문 결과 &nbsp;|&nbsp; ${escapeHtml(data.resultType||'')}</div>
      `;
    } else { // 경력
      const f = data.form || {};
      wrap.innerHTML = `
        <h2 style="margin:0 0 6px 0; font-size:24px;">경력사원  면접 사전 질문지</h2>
        <div style="font-size:14px; margin:4px 0 16px 0;">
          이름: <strong>${escapeHtml(data.name)}</strong> &nbsp;&nbsp;|&nbsp;&nbsp;
          생년월일: <strong>${escapeHtml(data.birth)}</strong>
        </div>

        <ol style="font-size:14px; line-height:1.7; padding-left:18px; margin:0;">
          <li style="margin-bottom:10px;">
            직장생활에서의 성공에 대해서 정의해 보십시오.<br>
            <div style="white-space:pre-wrap; margin-top:6px;">${escapeHtml(f.successDef||'')}</div>
          </li>

          <li style="margin-bottom:10px;">
            본인 성격의 장/단점에 대해 각각 간략하게 기입해 주십시오.
            <div style="white-space:pre-wrap; margin-top:6px;">#장점 - ${escapeHtml(f.pros||'')}</div>
            <div style="white-space:pre-wrap;">#단점 - ${escapeHtml(f.cons||'')}</div>
          </li>

          <li style="margin-bottom:10px;">
            본인이 다른 사람과 구별되는 특별히 뛰어난 점이 있다면 세가지 정도 기입해 주십시오.
            <div style="white-space:pre-wrap; margin-top:6px;">
              ① ${escapeHtml((f.strengths||[])[0]||'')}<br>
              ② ${escapeHtml((f.strengths||[])[1]||'')}<br>
              ③ ${escapeHtml((f.strengths||[])[2]||'')}
            </div>
          </li>

          <li style="margin-bottom:10px;">
            나를 표현하는 단어 3가지를 기입해 주십시오.<br>
            <div style="white-space:pre-wrap; margin-top:6px;">${escapeHtml(f.selfWords||'')}</div>
          </li>

          <li style="margin-bottom:10px;">
            가장 큰 성취를 했던 경험과 그 때 본인이 맡았던 역할을 기술해 주십시오.<br>
            <div style="white-space:pre-wrap; margin-top:6px;">${escapeHtml(f.bigAchievement||'')}</div>
          </li>

          <li style="margin-bottom:10px;">
            다음 보기 중에서 안랩 근무를 통해서 기대하는 것을 중요한 순서대로 나열해 주십시오.
            <div style="margin:6px 0; font-size:13px;">보기) 업무 외 개인시간, 연봉, 승진(지위), 인간관계, 업무성취, 자기개발</div>
            <div>① ${escapeHtml((f.expectations||[])[0]||'')} &nbsp; ② ${escapeHtml((f.expectations||[])[1]||'')} &nbsp; ③ ${escapeHtml((f.expectations||[])[2]||'')}</div>
            <div>④ ${escapeHtml((f.expectations||[])[3]||'')} &nbsp; ⑤ ${escapeHtml((f.expectations||[])[4]||'')} &nbsp; ⑥ ${escapeHtml((f.expectations||[])[5]||'')}</div>
          </li>

          <li style="margin-bottom:10px;">
            연봉 정보를 기입해 주십시오.
            <div style="margin-top:6px;">현재연봉: ${Number(f.salary?.now||0)} (만원)</div>
            <div>희망연봉: 최저 ${Number(f.salary?.min||0)} (만원) ~ 최고 ${Number(f.salary?.max||0)} (만원)</div>
          </li>
        </ol>

        <hr style="margin:12px 0;">
        <div style="font-size:13px;">※ 설문 결과 &nbsp;|&nbsp; ${escapeHtml(data.resultType||'')}</div>
      `;
    }

    document.body.appendChild(wrap);
    const canvas = await html2canvas(wrap, { scale: 2, backgroundColor: '#fff' });
    document.body.removeChild(wrap);

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
