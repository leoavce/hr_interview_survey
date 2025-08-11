// 관리자 페이지 (FastAPI 엔드포인트와 100% 호환)
// 중요 수정:
//  - /admin/generate-missing-pdfs 호출: 쿼리스트링 session_id 사용 (기존 바디 전송 → FastAPI 미호환 문제 해결)
//  - 실시간 폴링: /admin/latest 는 "리스트"를 반환 (기존 data.responses 접근 오류 수정)

let sessionId = null;

document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const genBtn = document.getElementById('btnGenPDF');
  const refreshLatest = document.getElementById('btnRefreshLatest');
  const refreshAll = document.getElementById('btnRefreshAll');

  loginBtn?.addEventListener('click', handleLogin);
  logoutBtn?.addEventListener('click', handleLogout);
  genBtn?.addEventListener('click', generateMissingPDFs);
  refreshLatest?.addEventListener('click', loadLatestResponses);
  refreshAll?.addEventListener('click', ()=>loadAllResponses(1));
});

async function handleLogin(){
  const pw = document.getElementById('password').value.trim();
  const err = document.getElementById('loginError');
  const btn = document.getElementById('loginBtn');
  if(!pw){ err.textContent='비밀번호를 입력해주세요.'; return; }

  try{
    btn.disabled = true; btn.textContent='로그인 중...';
    const res = await fetch('/admin/login', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({password: pw})
    });
    const data = await res.json();
    if(!res.ok) throw new Error(data.detail || '로그인 실패');
    sessionId = data.session_id;

    document.getElementById('loginContainer').style.display='none';
    const dash = document.getElementById('dashboard');
    dash.style.display='block';

    await loadDashboardData();
    startNotificationPolling();
  }catch(e){
    err.textContent = e.message;
  }finally{
    btn.disabled=false; btn.textContent='로그인';
  }
}

async function handleLogout(){
  try{ await fetch('/admin/logout', {method:'POST'}); }catch{}
  sessionId=null;
  stopNotificationPolling();
  document.getElementById('dashboard').style.display='none';
  document.getElementById('loginContainer').style.display='flex';
}

async function loadDashboardData(){
  await Promise.all([loadStats(), loadLatestResponses(), loadAllResponses(1)]);
}

async function loadStats(){
  try{
    const res = await fetch('/admin/stats');
    if(!res.ok) return;
    const s = await res.json();
    setText('totalResponses', s.total||0);
    setText('newEmployees', s.new_employees||0);
    setText('experiencedEmployees', s.experienced_employees||0);
    setText('todayResponses', s.today||0);
  }catch(e){console.error(e);}
}

async function loadLatestResponses(){
  try{
    const res = await fetch('/responses/latest');
    const arr = await res.json();
    renderResponsesTable(arr, 'latestResponsesContent', false);
  }catch(e){
    console.error(e);
    document.getElementById('latestResponsesContent').innerHTML='<div class="loading">데이터 로드 실패</div>';
  }
}

async function loadAllResponses(page=1){
  try{
    const res = await fetch(`/responses/all?page=${page}`);
    const data = await res.json();
    renderResponsesTable(data.responses, 'allResponsesContent', true, data);
    updateStorageInfo(data);
  }catch(e){
    console.error(e);
    document.getElementById('allResponsesContent').innerHTML='<div class="loading">데이터 로드 실패</div>';
  }
}

function renderResponsesTable(list, containerId, withPager, pageData){
  const el = document.getElementById(containerId);
  if(!list || list.length===0){ el.innerHTML='<div class="loading">응답 데이터가 없습니다.</div>'; return; }

  let html = `
    <table class="table">
      <thead>
        <tr>
          <th>이름</th>
          <th>생년월일</th>
          <th>지원자 유형</th>
          <th>제출 시간</th>
          <th>분석 결과</th>
          <th>PDF</th>
        </tr>
      </thead>
      <tbody>
  `;

  list.forEach(r=>{
    const t = new Date(r.submitted_at).toLocaleString('ko-KR');
    const typeClass = r.candidate_type==='신입지원' ? 'type-신입지원' : 'type-경력지원';
    html += `
      <tr>
        <td>${r.name}</td>
        <td>${r.birth_date}</td>
        <td><span class="type-badge ${typeClass}">${r.candidate_type}</span></td>
        <td>${t}</td>
        <td><span class="result-badge">${r.result_type||'-'}</span></td>
        <td>${r.pdf_url ? `<button class="pdf-btn" onclick="viewPDF(${r.id})">PDF 보기</button>` : '생성 중...'}</td>
      </tr>
    `;
  });

  html += '</tbody></table>';

  if(withPager && pageData){
    html += '<div class="pagination">';
    if(pageData.page>1) html += `<button onclick="loadAllResponses(${pageData.page-1})">이전</button>`;
    for(let i=1;i<=pageData.total_pages;i++){
      html += `<button class="${i===pageData.page?'current':''}" onclick="loadAllResponses(${i})">${i}</button>`;
    }
    if(pageData.page<pageData.total_pages) html += `<button onclick="loadAllResponses(${pageData.page+1})">다음</button>`;
    html += '</div>';
  }

  el.innerHTML = html;
}

window.viewPDF = function(id){
  if(!sessionId){ alert('세션이 만료되었습니다. 다시 로그인해주세요.'); return; }
  window.open(`/admin/view-pdf/${id}?session_id=${sessionId}`, '_blank');
};

function updateStorageInfo(data){
  const el = document.getElementById('storageStatus');
  const current = data.total||0, max = data.max_capacity||30, full = data.is_full||false;
  let txt = `현재 ${current}명 / 최대 ${max}명`;
  if(full) txt += ' ⚠️ 저장소 가득참 (새 응답 시 오래된 데이터 자동 삭제)';
  else txt += ` (여유: ${max-current}명)`;
  el.textContent = txt;
}

/* PDF 생성 요청 — ★핵심 수정: 쿼리스트링 session_id */
async function generateMissingPDFs(){
  if(!sessionId){ alert('세션이 만료되었습니다. 다시 로그인해주세요.'); return; }
  if(!confirm('PDF가 없는 응답에 대해 PDF를 생성하시겠습니까?')) return;
  try{
    const res = await fetch(`/admin/generate-missing-pdfs?session_id=${sessionId}`, {method:'POST'});
    const data = await res.json();
    if(!res.ok) throw new Error(data.detail || 'PDF 생성 실패');
    alert(data.message || 'PDF 생성 완료');
    await loadLatestResponses();
    await loadAllResponses(1);
  }catch(e){
    alert('PDF 생성 중 오류: ' + e.message);
  }
}

/* 알림 폴링 — /admin/latest 는 리스트를 반환 */
let notifTimer = null, notified = new Set();
function startNotificationPolling(){
  stopNotificationPolling();
  notifTimer = setInterval(async ()=>{
    try{
      const res = await fetch(`/admin/latest?session_id=${sessionId}`);
      if(!res.ok) return;
      const arr = await res.json(); // 리스트
      arr.forEach(r=>{
        if(!notified.has(r.id)){
          showNotification(`새 응답이 제출되었습니다 - ${r.name}님 (${new Date(r.submitted_at).toLocaleTimeString()})`);
          notified.add(r.id);
          loadLatestResponses();
          loadStats();
        }
      });
      if (notified.size>50){
        const a=[...notified]; notified = new Set(a.slice(-30));
      }
    }catch(e){ console.error(e); }
  }, 5000);
}
function stopNotificationPolling(){ if(notifTimer){ clearInterval(notifTimer); notifTimer=null; } }
function showNotification(msg){
  const n = document.getElementById('notification');
  n.textContent = msg;
  n.classList.add('show');
  setTimeout(()=>n.classList.remove('show'), 8000);
}

function setText(id, v){ const el=document.getElementById(id); if(el) el.textContent=v; }
