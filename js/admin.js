// js/admin.js
(async function () {
  // Firebase 준비 확인
  if (!window.firebase || !window.auth || !window.db) {
    console.error('Firebase 초기화가 이루어지지 않았습니다. (firebase-init.js → admin.js 순서 확인)');
    alert('Firebase 초기화 오류: 스크립트 로딩 순서를 확인해주세요.');
    return;
  }

  try {
    await auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
  } catch (e) {
    console.warn('세션 퍼시스턴스 설정 실패:', e);
  }

  // DOM
  const loginForm   = document.getElementById('adminLogin');
  const adminPanel  = document.getElementById('adminPanel');
  const loginError  = document.getElementById('loginError');

  const totalCountEl = document.getElementById('totalCount');
  const newCountEl   = document.getElementById('newCount');
  const expCountEl   = document.getElementById('expCount');
  const todayCountEl = document.getElementById('todayCount');
  const listEl       = document.getElementById('list');
  const logoutBtn    = document.getElementById('logoutBtn');

  // 익명 계정은 관리자 로그인으로 취급하지 않음
  auth.onAuthStateChanged((user) => {
    const isAdmin = !!(user && !user.isAnonymous);
    if (isAdmin) {
      loginForm.style.display = 'none';
      adminPanel.style.display = 'block';
      loadStatsAndList();
    } else {
      adminPanel.style.display = 'none';
      loginForm.style.display = 'block';
    }
  });

  // 로그인
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.style.display = 'none';
    const email = document.getElementById('adminEmail').value.trim();
    const pw    = document.getElementById('adminPw').value;
    try {
      await auth.signInWithEmailAndPassword(email, pw);
    } catch (err) {
      loginError.textContent = err.message || '로그인 실패';
      loginError.style.display = 'block';
    }
  });

  // 로그아웃
  if (logoutBtn) logoutBtn.addEventListener('click', () => auth.signOut());

  // 목록/통계 로드
  async function loadStatsAndList() {
    const snap = await db.collection('responses').orderBy('date','desc').get();
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    const today = new Date().toISOString().slice(0,10);
    totalCountEl.textContent = docs.length;
    newCountEl.textContent   = docs.filter(d => d.type === '신입').length;
    expCountEl.textContent   = docs.filter(d => d.type === '경력').length;
    todayCountEl.textContent = docs.filter(d => (d.date||'').slice(0,10) === today).length;

    listEl.innerHTML = docs.map(doc => {
      const when = new Date(doc.date).toLocaleString('ko-KR');
      return `
        <div class="row item">
          <div class="col">
            <div class="name">${escapeHtml(doc.name)} <span class="muted">(${escapeHtml(doc.birth)})</span></div>
            <div class="meta">${when} · <span class="badge small">${escapeHtml(doc.type)}</span> · 결과: ${escapeHtml(doc.resultType||'')}</div>
          </div>
          <div class="col actions">
            <button class="btn small" data-generate="${doc.id}">PDF 생성/다운</button>
          </div>
        </div>
      `;
    }).join('');

    // PDF 생성/다운
    listEl.querySelectorAll('button[data-generate]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id  = btn.getAttribute('data-generate');
        const doc = docs.find(d => d.id === id);
        if (!doc) return;
        try {
          btn.disabled = true;
          btn.textContent = '생성 중...';
          const blob = await generatePdfFromDoc(doc);
          const a = document.createElement('a');
          const url = URL.createObjectURL(blob);
          a.href = url;
          a.download = `AhnLab_응답_${doc.type}_${doc.name}_${doc.birth}.pdf`;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
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

  // ===== PDF 생성 도우미 =====
  function computeTypeScoresFromSelects(selects=[]) {
    const map = {
      A:[1,7,9,13,17,24,26,32,33,39,41,48,50,53,57,63,65,70,74,79],
      B:[2,8,10,14,18,23,25,30,34,37,42,47,51,55,58,62,66,69,75,77],
      C:[4,5,12,16,19,22,27,29,36,38,43,46,49,56,59,64,68,72,76,80],
      D:[3,6,11,15,20,21,28,31,35,40,44,45,52,54,60,61,67,71,73,78]
    };
    const scores = {A:0,B:0,C:0,D:0};
    selects.forEach((ans, i) => {
      const q1 = i*2 + 1;
      const q2 = i*2 + 2;
      const selected = ans === 1 ? q1 : ans === 2 ? q2 : null;
      if (!selected) return;
      for (const t in map) if (map[t].includes(selected)) { scores[t]++; break; }
    });
    return scores;
  }

  function typeTableHtml(scores) {
    const A = Number(scores?.A||0), B = Number(scores?.B||0),
          C = Number(scores?.C||0), D = Number(scores?.D||0);
    return `
      <div style="margin-top:8px;">
        <div style="font-size:13px; margin-bottom:6px;">※ 선택형 설문 결과</div>
        <table style="width:100%; border-collapse:collapse; font-size:13px;">
          <thead>
            <tr>
              <th style="border:1px solid #ccc; padding:6px;">A형</th>
              <th style="border:1px solid #ccc; padding:6px;">B형</th>
              <th style="border:1px solid #ccc; padding:6px;">C형</th>
              <th style="border:1px solid #ccc; padding:6px;">D형</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border:1px solid #ccc; padding:8px; text-align:center;">${A}</td>
              <td style="border:1px solid #ccc; padding:8px; text-align:center;">${B}</td>
              <td style="border:1px solid #ccc; padding:8px; text-align:center;">${C}</td>
              <td style="border:1px solid #ccc; padding:8px; text-align:center;">${D}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  // ===== 질문/답변 꾸미기 유틸 =====
  function _wrapTextHTML(txt='') {
    return `<div style="white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;">${escapeHtml(txt)}</div>`;
  }
  const ANSWER_BOX_STYLE =
    'margin-top:6px;padding:8px;background:#f9f9f9;border:1px solid #ddd;border-radius:4px;';

  function _bulletLine(label, txt) {
    return `
      <div style="display:flex;gap:8px;align-items:flex-start;margin-top:6px;">
        <div style="width:18px;flex:0 0 18px;text-align:left;font-weight:700;">${label}</div>
        <div style="flex:1;min-width:0;${ANSWER_BOX_STYLE}">
          ${_wrapTextHTML(txt)}
        </div>
      </div>
    `;
  }

  // ===== 멀티페이지 PDF 생성기 (안정화) =====
  async function _canvasToMultipagePdf(canvas) {
    const { jsPDF } = window.jspdf;
    const pdf   = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });

    const margin   = 20;
    const pageW    = Math.round(pdf.internal.pageSize.getWidth());
    const pageH    = Math.round(pdf.internal.pageSize.getHeight());
    const drawW    = pageW - margin * 2;
    const scale    = drawW / canvas.width;
    const innerHpt = pageH - margin * 2;

    const sliceHpxBase = Math.floor(innerHpt / scale);
    const overlapPxDefault = 6;

    const tmp = document.createElement('canvas');
    const ctx = tmp.getContext('2d');

    let y = 0;
    let first = true;

    while (y < canvas.height) {
      const remain = canvas.height - y;
      const take = Math.min(sliceHpxBase, remain);

      tmp.width  = canvas.width;
      tmp.height = take;
      ctx.clearRect(0, 0, tmp.width, tmp.height);
      ctx.drawImage(canvas, 0, y, canvas.width, take, 0, 0, canvas.width, take);

      if (!first) pdf.addPage();
      first = false;

      // 페이지 흰 배경
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pageW, pageH, 'F');

      // 이미지(JPEG로 삽입해 메모리 절감)
      const drawH = Math.round(take * scale);
      const img   = tmp.toDataURL('image/jpeg', 0.9);
      pdf.addImage(img, 'JPEG',
        Math.round(margin), Math.round(margin),
        Math.round(drawW), drawH
      );

      // 페이지 외곽 프레임
      pdf.setLineWidth(1);
      pdf.setDrawColor(20);
      const frameX = margin - 6, frameY = margin - 6,
            frameW = pageW - (margin - 6) * 2, frameH = pageH - (margin - 6) * 2;
      if (pdf.roundedRect) pdf.roundedRect(frameX, frameY, frameW, frameH, 8, 8);
      else pdf.rect(frameX, frameY, frameW, frameH);

      // 다음 슬라이스로 이동 (마지막 조각이면 오버랩 없음)
      const overlapThis = (remain <= overlapPxDefault) ? 0 : overlapPxDefault;
      const advance = Math.max(1, take - overlapThis); // 0 이하 방지 → 무한루프 차단
      y += advance;
    }
    return pdf.output('blob');
  }

  // ===== PDF 생성 (디자인 유지 + 안정화된 렌더링) =====
  async function generatePdfFromDoc(data) {
    const scores = (data.typeScores && typeof data.typeScores === 'object')
      ? data.typeScores
      : computeTypeScoresFromSelects(data.selects);

    const wrap = document.createElement('div');
    wrap.style.position = 'absolute';
    wrap.style.left = '-9999px';
    wrap.style.top = '-9999px';
    wrap.style.width = '794px';
    wrap.style.background = '#fff';
    wrap.style.padding = '24px'; // 상단 살짝 당김
    wrap.style.fontFamily = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Noto Sans KR",sans-serif';
    wrap.style.color = '#111';

    const title = (data.type === '신입') ? '신입사원  면접 사전 질문지' : '경력사원  면접 사전 질문지';
    const f = data.form || {};

    // 이름/생년월일 작은 박스
    const infoBox = (label, value) =>
      `<span style="display:inline-block;border:1px solid #ccc;border-radius:6px;padding:4px 8px;margin-right:8px;">
        <strong>${label}:</strong> ${escapeHtml(value||'')}
      </span>`;

    const headerHtml = `
      <h2 style="margin:0 0 8px 0; font-size:24px; font-weight:800;">${title}</h2>
      <div style="font-size:14px; margin:0 0 12px 0;">
        ${infoBox('이름', data.name)} ${infoBox('생년월일', data.birth)}
      </div>
    `;

    const typeTable = typeTableHtml(scores);

    let bodyHtml = `<ol style="font-size:14px; line-height:1.7; padding-left:18px; margin:0;">`;

    if (data.type === '신입') {
      // (간결 배치) 4번 항목 일부 라벨-우측 박스 배치, 6번 한 줄 표기
      bodyHtml += `
        <li style="margin-bottom:10px;">
          <strong>안랩에서 꿈꾸는 미래 포부 (희망하는 역할/목표)에 대해서 말씀해 주십시오.</strong>
          <div style="${ANSWER_BOX_STYLE}">${_wrapTextHTML(f.dream||'')}</div>
        </li>

        <li style="margin-bottom:10px;">
          <strong>본인이 다른 사람과 구별되는 특별히 뛰어난 점이 있다면 최대 3가지(1가지여도 무방함) 소개해 주십시오.</strong>
          ${_bulletLine('①', (f.strengths||[])[0]||'')}
          ${_bulletLine('②', (f.strengths||[])[1]||'')}
          ${_bulletLine('③', (f.strengths||[])[2]||'')}
        </li>

        <li style="margin-bottom:10px;">
          <strong>살아오면서 성취한 것 중 타인에게 자랑할 만한 것을 3가지 소개해 주십시오.</strong>
          ${_bulletLine('①', (f.achievements||[])[0]||'')}
          ${_bulletLine('②', (f.achievements||[])[1]||'')}
          ${_bulletLine('③', (f.achievements||[])[2]||'')}
        </li>

        <li style="margin-bottom:10px;">
          <strong>지원 직무(부문)에서 성과를 내기 위해 필요한 역량이 무엇이라고 생각하시는지 기술해 주십시오.</strong>
          <div style="display:flex;gap:8px;align-items:flex-start;margin-top:6px;flex-wrap:wrap;">
            <div style="flex:0 0 auto;margin-top:4px;">● 필요역량 :</div>
            <div style="flex:1;min-width:220px;${ANSWER_BOX_STYLE}">${_wrapTextHTML(f.competency?.needed||'')}</div>
          </div>
          <div style="margin-top:6px;">● 본인의 역량 보유 수준 : <strong>${Number(f.competency?.score||0)}</strong> 점 / 10점</div>
          <div style="display:flex;gap:8px;align-items:flex-start;margin-top:6px;flex-wrap:wrap;">
            <div style="flex:0 0 auto;margin-top:4px;">● 필요 역량을 갖추기 위한 과정(노력) :</div>
            <div style="flex:1;min-width:220px;${ANSWER_BOX_STYLE}">${_wrapTextHTML(f.competency?.effort||'')}</div>
          </div>
        </li>

        <li style="margin-bottom:10px;">
          <strong>타인이 인정(칭찬)하는 본인 성격(성향)상의 장점과 그 이유를 기술해주십시오.</strong>
          <div style="${ANSWER_BOX_STYLE}">${_wrapTextHTML(f.personalityStrength||'')}</div>
        </li>

        <li style="margin-bottom:10px;">
          <strong>다음 보기 중에서 안랩 근무를 통해서 기대하는 것을 중요한 순서대로 나열해 주십시오.</strong>
          <div style="margin:6px 0; font-size:13px;">보기) 업무 외 개인시간, 연봉, 승진(지위), 인간관계, 업무성취, 자기개발</div>
          <div style="${ANSWER_BOX_STYLE}">
            ① ${escapeHtml((f.expectations||[])[0]||'')} &nbsp; ② ${escapeHtml((f.expectations||[])[1]||'')} &nbsp; ③ ${escapeHtml((f.expectations||[])[2]||'')} &nbsp;
            ④ ${escapeHtml((f.expectations||[])[3]||'')} &nbsp; ⑤ ${escapeHtml((f.expectations||[])[4]||'')} &nbsp; ⑥ ${escapeHtml((f.expectations||[])[5]||'')}
          </div>
        </li>

        <li style="margin-bottom:10px;">
          <strong>안랩 외에 현재 최종면접이 진행중이거나 합격한 회사가 있습니까?</strong>
          <div style="${ANSWER_BOX_STYLE}">${_wrapTextHTML(f.otherOffers||'')}</div>
        </li>

        <li style="margin-bottom:10px;">
          <strong>희망연봉은?</strong>
          <div style="${ANSWER_BOX_STYLE}">최저 ${Number(f.salary?.min||0)} (만원) ~ 최고 ${Number(f.salary?.max||0)} (만원)</div>
        </li>
      `;
    } else {
      bodyHtml += `
        <li style="margin-bottom:10px;">
          <strong>직장생활에서의 성공에 대해서 정의해 보십시오.</strong>
          <div style="${ANSWER_BOX_STYLE}">${_wrapTextHTML(f.successDef||'')}</div>
        </li>

        <li style="margin-bottom:10px;">
          <strong>본인 성격의 장/단점에 대해 각각 간략하게 기입해 주십시오.</strong>
          <div style="margin-top:6px;">#장점</div>
          <div style="${ANSWER_BOX_STYLE}">${_wrapTextHTML(f.pros||'')}</div>
          <div style="margin-top:6px;">#단점</div>
          <div style="${ANSWER_BOX_STYLE}">${_wrapTextHTML(f.cons||'')}</div>
        </li>

        <li style="margin-bottom:10px;">
          <strong>본인이 다른 사람과 구별되는 특별히 뛰어난 점이 있다면 세가지 정도 기입해 주십시오.</strong>
          ${_bulletLine('①', (f.strengths||[])[0]||'')}
          ${_bulletLine('②', (f.strengths||[])[1]||'')}
          ${_bulletLine('③', (f.strengths||[])[2]||'')}
        </li>

        <li style="margin-bottom:10px;">
          <strong>나를 표현하는 단어 3가지를 기입해 주십시오.</strong>
          <div style="${ANSWER_BOX_STYLE}">${_wrapTextHTML(f.selfWords||'')}</div>
        </li>

        <li style="margin-bottom:10px;">
          <strong>가장 큰 성취를 했던 경험과 그 때 본인이 맡았던 역할을 기술해 주십시오.</strong>
          <div style="${ANSWER_BOX_STYLE}">${_wrapTextHTML(f.bigAchievement||'')}</div>
        </li>

        <li style="margin-bottom:10px;">
          <strong>다음 보기 중에서 안랩 근무를 통해서 기대하는 것을 중요한 순서대로 나열해 주십시오.</strong>
          <div style="margin:6px 0; font-size:13px;">보기) 업무 외 개인시간, 연봉, 승진(지위), 인간관계, 업무성취, 자기개발</div>
          <div style="${ANSWER_BOX_STYLE}">
            ① ${escapeHtml((f.expectations||[])[0]||'')} &nbsp; ② ${escapeHtml((f.expectations||[])[1]||'')} &nbsp; ③ ${escapeHtml((f.expectations||[])[2]||'')} &nbsp;
            ④ ${escapeHtml((f.expectations||[])[3]||'')} &nbsp; ⑤ ${escapeHtml((f.expectations||[])[4]||'')} &nbsp; ⑥ ${escapeHtml((f.expectations||[])[5]||'')}
          </div>
        </li>

        <li style="margin-bottom:10px;">
          <strong>연봉 정보를 기입해 주십시오.</strong>
          <div style="${ANSWER_BOX_STYLE}">
            현재연봉: ${Number(f.salary?.now||0)} (만원) &nbsp; | &nbsp;
            희망연봉: 최저 ${Number(f.salary?.min||0)} (만원) ~ 최고 ${Number(f.salary?.max||0)} (만원)
          </div>
        </li>
      `;
    }

    wrap.innerHTML = `${headerHtml}${bodyHtml}</ol><hr style="margin:10px 0;">${typeTable}`;

    document.body.appendChild(wrap);

    // ★ 안정화된 html2canvas 호출
    const scaleSafe = Math.min(1.6, window.devicePixelRatio || 1);
    const canvas = await html2canvas(wrap, {
      scale: scaleSafe,
      backgroundColor: '#fff',
      useCORS: true,
      logging: false
    });

    document.body.removeChild(wrap);

    // 멀티페이지 PDF 생성
    return await _canvasToMultipagePdf(canvas);
  }

  function escapeHtml(s){
    return String(s||'').replace(/[&<>"']/g,(m)=>({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[m]));
  }
})();

