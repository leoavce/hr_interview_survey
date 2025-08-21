// js/lock.js
(function () {
  // 이미 통과했으면(동일 세션) 재요청 안 함
  const KEY = 'ahn_gate_ok';
  if (sessionStorage.getItem(KEY) === '1') return;

  // 스타일 주입
  const style = document.createElement('style');
  style.textContent = `
    .ahnlock__overlay {
      position: fixed; inset: 0; z-index: 99999;
      display: grid; place-items: center;
      background: rgba(10, 20, 40, .65);
      backdrop-filter: blur(2px);
    }
    .ahnlock__card {
      width: min(90vw, 420px);
      background: #ffffff; color:#111;
      border-radius: 14px; box-shadow: 0 10px 30px rgba(0,0,0,.25);
      padding: 20px 18px;
      font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Noto Sans KR",sans-serif;
    }
    .ahnlock__title { font-size: 18px; font-weight: 800; margin: 0 0 4px; }
    .ahnlock__sub   { font-size: 13px; color:#667085; margin: 0 0 16px; }
    .ahnlock__row   { display:flex; gap:8px; }
    .ahnlock__input {
      flex:1; height: 40px; border-radius: 10px;
      border:1px solid #d0d5dd; padding: 0 12px; font-size:14px;
      outline: none; transition: border-color .2s;
    }
    .ahnlock__input:focus { border-color:#4a67d6; }
    .ahnlock__btn {
      height: 40px; padding: 0 14px; border-radius: 10px;
      border:0; background:#3056d3; color:#fff; font-weight:700; cursor:pointer;
    }
    .ahnlock__btn:disabled { opacity:.6; cursor: not-allowed; }
    .ahnlock__err { color:#d92d20; font-size:12px; margin-top:10px; min-height: 16px; }
    .ahnlock__shake { animation: ahnlockshake .32s linear 1; }
    @keyframes ahnlockshake {
      0%,100%{ transform: translateX(0); }
      25%{ transform: translateX(-4px); }
      75%{ transform: translateX(4px); }
    }
  `;
  document.head.appendChild(style);

  // 오버레이 DOM 생성
  const overlay = document.createElement('div');
  overlay.className = 'ahnlock__overlay';
  overlay.innerHTML = `
    <div class="ahnlock__card" role="dialog" aria-modal="true">
      <h3 class="ahnlock__title">접속 비밀번호</h3>
      <p class="ahnlock__sub">페이지에 접근하기 위해 비밀번호를 입력하세요.</p>
      <div class="ahnlock__row">
        <input class="ahnlock__input" type="password" placeholder="비밀번호" autocomplete="off" />
        <button class="ahnlock__btn" type="button">확인</button>
      </div>
      <div class="ahnlock__err" aria-live="polite"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  // 스크롤 잠금
  const prevOverflow = document.documentElement.style.overflow;
  document.documentElement.style.overflow = 'hidden';

  const input = overlay.querySelector('.ahnlock__input');
  const btn   = overlay.querySelector('.ahnlock__btn');
  const err   = overlay.querySelector('.ahnlock__err');
  const card  = overlay.querySelector('.ahnlock__card');

  function unlock() {
    // 통과 표시 → 동일 세션에선 재요청 안 함
    sessionStorage.setItem(KEY, '1');
    document.body.removeChild(overlay);
    document.documentElement.style.overflow = prevOverflow || '';
  }

  function fail(msg) {
    err.textContent = msg || '비밀번호가 올바르지 않습니다.';
    card.classList.remove('ahnlock__shake');
    // reflow 후 적용(연속 입력 시 애니 재생)
    void card.offsetWidth;
    card.classList.add('ahnlock__shake');
  }

  function submit() {
    const val = (input.value || '').trim();
    // 정답: ahnlabhr0315@
    if (val === 'ahnlabhr0315@') unlock();
    else fail();
  }

  btn.addEventListener('click', submit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submit();
  });

  // 포커스
  setTimeout(() => input.focus(), 0);
})();
