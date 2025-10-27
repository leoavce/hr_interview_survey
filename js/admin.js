// js/admin.js (포트폴리오 일반화 버전)
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
          a.download = `Portfolio_응답_${doc.type}_${doc.name || '이름없음'}_${doc.birth || '생년월일없음'}.pdf`;
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
      A:[/* 직접입력필요 */],
      B:[/* 직접입력필요 */],
      C:[/* 직접입력필요 */],
      D:[/* 직접입력필요 */]
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
        <div style="font-size:13px; margin-bottom:6px;">※ 선택형 설문 결과(포트폴리오)</div>
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
    'margin-top:6px;padding:6px 8px;background:#f9f9f9;border:1px solid #ddd;border-radius:4px;line-height:1.35;';

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

  // ===== 멀티페이지 PDF (안전 분기점 기반) =====
  async function _canvasToMultipagePdfSmart(canvas, guidesCanvasPx) {
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
    const MIN_CHUNK = 50;
    const MIN_REMAINDER = 32;
    const MIN_DRAW_PT = 6;

    const tmp = document.createElement('canvas');
    const ctx = tmp.getContext('2d');

    let y = 0;
    let first = true;

    while (y < canvas.height) {
      const remain = canvas.height - y;
      if (remain <= MIN_REMAINDER) break;

      const idealEnd = y + sliceHpxBase - 4;
      let safeEnd = -1;

      if (Array.isArray(guidesCanvasPx) && guidesCanvasPx.length) {
        let lo = 0, hi = guidesCanvasPx.length - 1;
        while (lo <= hi) {
          const mid = (lo + hi) >> 1;
          if (guidesCanvasPx[mid] <= idealEnd) { safeEnd = guidesCanvasPx[mid]; lo = mid + 1; }
          else hi = mid - 1;
        }
      }

      let take;
      if (safeEnd > y && (safeEnd - y) >= MIN_CHUNK) {
        take = Math.min(safeEnd - y, remain);
      } else {
        take = Math.min(sliceHpxBase, remain);
      }

      if (remain - take <= MIN_REMAINDER) take = remain;

      const drawHpt = Math.round(take * scale);
      if (drawHpt < MIN_DRAW_PT) break;

      tmp.width  = canvas.width;
      tmp.height = take;
      ctx.clearRect(0, 0, tmp.width, tmp.height);
      ctx.drawImage(canvas, 0, y, canvas.width, take, 0, 0, canvas.width, take);

      if (!first) pdf.addPage();
      first = false;

      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pageW, pageH, 'F');

      const img   = tmp.toDataURL('image/jpeg', 0.9);
      pdf.addImage(img, 'JPEG',
        Math.round(margin), Math.round(margin),
        Math.round(drawW), drawHpt
      );

      pdf.setLineWidth(1);
      pdf.setDrawColor(20);
      const frameX = margin - 6, frameY = margin - 6,
            frameW = pageW - (margin - 6) * 2, frameH = pageH - (margin - 6) * 2;
      if (pdf.roundedRect) pdf.roundedRect(frameX, frameY, frameW, frameH, 8, 8);
      else pdf.rect(frameX, frameY, frameW, frameH);

      const overlapThis = (remain <= overlapPxDefault) ? 0 : overlapPxDefault;
      const advance = Math.max(1, take - overlapThis);
      y += advance;
    }

    return pdf.output('blob');
  }

  // ===== PDF 생성 (일반화된 문구 적용) =====
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
    wrap.style.padding = '22px';
    wrap.style.fontFamily = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Noto Sans KR",sans-serif';
    wrap.style.color = '#111';

    const title = (data.type === '신입') ? '사전 질문지(포트폴리오) — 신입' : '사전 질문지(포트폴리오) — 경력';
    const f = data.form || {};

    const infoBox = (label, value) =>
      `<span style="display:inline-block;border:1px solid #ccc;border-radius:6px;padding:4px 8px;margin-right:8px;">
        <strong>${label}:</strong> ${escapeHtml(value||'')}
      </span>`;

    const headerHtml = `
      <h2 style="margin:0 0 4px 0; font-size:24px; font-weight:800;">${title}</h2>
      <div style="font-size:14px; margin:0 0 10px 0;">
        ${infoBox('이름', data.name)} ${infoBox('생년월일', data.birth)}
      </div>
    `;

    const typeTable = typeTableHtml(scores);

    let bodyHtml = `<ol style="font-size:14px; line-height:1.7; padding-left:18px; margin:0;">`;

    if (data.type === '신입') {
      bodyHtml += `
        <li style="margin-bottom:10px;">
          <strong>미래 포부(희망 역할/목표)</strong>
          <div style="${ANSWER_BOX_STYLE}">${_wrapTextHTML(f.dream||'')}</div>
        </li>

        <li style="margin-bottom:10px;">
          <strong>강점/개성 (최대 3가지)</strong>
          ${_bulletLine('①', (f.strengths||[])[0]||'')}
          ${_bulletLine('②', (f.strengths||[])[1]||'')}
          ${_bulletLine('③', (f.strengths||[])[2]||'')}
        </li>

        <li style="margin-bottom:10px;">
          <strong>자신 있게 제시할 경험/성과 (3가지)</strong>
          ${_bulletLine('①', (f.achievements||[])[0]||'')}
          ${_bulletLine('②', (f.achievements||[])[1]||'')}
          ${_bulletLine('③', (f.achievements||[])[2]||'')}
        </li>

        <li style="margin-bottom:10px;">
          <strong>지원 직무 성과를 위한 핵심 역량</strong>
          <div style="display:flex;gap:8px;align-items:flex-start;margin-top:6px;flex-wrap:wrap;">
            <div style="flex:0 0 auto;margin-top:4px;">● 필요역량 :</div>
            <div style="flex:1;min-width:220px;${ANSWER_BOX_STYLE}">${_wrapTextHTML(f.competency?.needed||'')}</div>
          </div>
          <div style="margin-top:6px;">● 본인의 보유 수준 : <strong>${Number(f.competency?.score||0)}</strong> 점 / 10점</div>
          <div style="display:flex;gap:8px;align-items:flex-start;margin-top:6px;flex-wrap:wrap;">
            <div style="flex:0 0 auto;margin-top:4px;">● 역량 개발 노력 :</div>
            <div style="flex:1;min-width:220px;${ANSWER_BOX_STYLE}">${_wrapTextHTML(f.competency?.effort||'')}</div>
          </div>
        </li>

        <li style="margin-bottom:10px;">
          <strong>주변이 말하는 성격(성향) 상의 장점</strong>
          <div style="${ANSWER_BOX_STYLE}">${_wrapTextHTML(f.personalityStrength||'')}</div>
        </li>

        <li style="margin-bottom:10px;">
          <strong>일에서 기대하는 가치 — 우선순위</strong>
          <div style="margin:6px 0; font-size:13px;">예시) 성장, 보상, 안정, 영향력, 문화/동료, 워라밸</div>
          <div style="${ANSWER_BOX_STYLE}">
            ① ${escapeHtml((f.expectations||[])[0]||'')} &nbsp; ② ${escapeHtml((f.expectations||[])[1]||'')} &nbsp; ③ ${escapeHtml((f.expectations||[])[2]||'')} &nbsp;
            ④ ${escapeHtml((f.expectations||[])[3]||'')} &nbsp; ⑤ ${escapeHtml((f.expectations||[])[4]||'')} &nbsp; ⑥ ${escapeHtml((f.expectations||[])[5]||'')}
          </div>
        </li>

        <li style="margin-bottom:10px;">
          <strong>다른 지원 현황</strong>
          <div style="${ANSWER_BOX_STYLE}">${_wrapTextHTML(f.otherOffers||'')}</div>
        </li>

        <li style="margin-bottom:10px;">
          <strong>희망 연봉</strong>
          <div style="${ANSWER_BOX_STYLE}">최저 ${Number(f.salary?.min||0)} (만원) ~ 최고 ${Number(f.salary?.max||0)} (만원)</div>
        </li>
      `;
    } else {
      bodyHtml += `
        <li style="margin-bottom:10px;">
          <strong>‘일에서의 성공’에 대한 본인의 정의</strong>
          <div style="${ANSWER_BOX_STYLE}">${_wrapTextHTML(f.successDef||'')}</div>
        </li>

        <li style="margin-bottom:10px;">
          <strong>성격 장/단점</strong>
          <div style="margin-top:6px;">#장점</div>
          <div style="${ANSWER_BOX_STYLE}">${_wrapTextHTML(f.pros||'')}</div>
          <div style="margin-top:6px;">#단점</div>
          <div style="${ANSWER_BOX_STYLE}">${_wrapTextHTML(f.cons||'')}</div>
        </li>

        <li style="margin-bottom:10px;">
          <strong>차별화된 강점 (3가지)</strong>
          ${_bulletLine('①', (f.strengths||[])[0]||'')}
          ${_bulletLine('②', (f.strengths||[])[1]||'')}
          ${_bulletLine('③', (f.strengths||[])[2]||'')}
        </li>

        <li style="margin-bottom:10px;">
          <strong>나를 표현하는 단어 3가지</strong>
          <div style="${ANSWER_BOX_STYLE}">${_wrapTextHTML(f.selfWords||'')}</div>
        </li>

        <li style="margin-bottom:10px;">
          <strong>가장 큰 성취와 역할</strong>
          <div style="${ANSWER_BOX_STYLE}">${_wrapTextHTML(f.bigAchievement||'')}</div>
        </li>

        <li style="margin-bottom:10px;">
          <strong>일에서 중요하게 여기는 가치 — 우선순위</strong>
          <div style="margin:6px 0; font-size:13px;">예시) 성장, 보상, 안정, 영향력, 문화/동료, 워라밸</div>
          <div style="${ANSWER_BOX_STYLE}">
            ① ${escapeHtml((f.expectations||[])[0]||'')} &nbsp; ② ${escapeHtml((f.expectations||[])[1]||'')} &nbsp; ③ ${escapeHtml((f.expectations||[])[2]||'')} &nbsp;
            ④ ${escapeHtml((f.expectations||[])[3]||'')} &nbsp; ⑤ ${escapeHtml((f.expectations||[])[4]||'')} &nbsp; ⑥ ${escapeHtml((f.expectations||[])[5]||'')}
          </div>
        </li>

        <li style="margin-bottom:10px;">
          <strong>연봉 정보</strong>
          <div style="${ANSWER_BOX_STYLE}">
            현재연봉: ${Number(f.salary?.now||0)} (만원) &nbsp; | &nbsp;
            희망: 최저 ${Number(f.salary?.min||0)} (만원) ~ 최고 ${Number(f.salary?.max||0)} (만원)
          </div>
        </li>
      `;
    }

    wrap.innerHTML = `${headerHtml}${bodyHtml}</ol><hr style="margin:10px 0;">${typeTable}`;

    document.body.appendChild(wrap);

    const wrapRect = wrap.getBoundingClientRect();
    const collect = [];
    const pushBottom = (el) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      collect.push(r.bottom - wrapRect.top);
    };
    pushBottom(wrap.querySelector('h2'));
    wrap.querySelectorAll('ol > li').forEach(pushBottom);
    pushBottom(wrap.querySelector('hr'));
    pushBottom(wrap.querySelector('table'));

    const scaleSafe = Math.min(1.6, window.devicePixelRatio || 1);
    const canvas = await html2canvas(wrap, {
      scale: scaleSafe,
      backgroundColor: '#fff',
      useCORS: true,
      logging: false
    });

    document.body.removeChild(wrap);

    const scaleCanvas = canvas.width / 794;
    const guidesCanvasPx = collect
      .map(px => Math.round(px * scaleCanvas))
      .sort((a,b)=>a-b);

    return await _canvasToMultipagePdfSmart(canvas, guidesCanvasPx);
  }

  function escapeHtml(s){
    return String(s||'').replace(/[&<>"']/g,(m)=>({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[m]));
  }
})();
