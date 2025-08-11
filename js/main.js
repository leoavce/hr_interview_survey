// Modern index interactions (single UI only)
let selectedType = null;

const typeButtons = document.querySelectorAll('.type-btn');
const userInfoBox = document.getElementById('userInfoBox');
const startBtn = document.getElementById('startBtn');
const nameInput = document.getElementById('name');
const birthInput = document.getElementById('birthDate');
const err = document.getElementById('errorMessage');
const loading = document.getElementById('loading');

// 1) 지원유형 선택 (중복 UI 제거됨: 이 파일만 사용)
typeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    typeButtons.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedType = btn.dataset.type;
    err.textContent = '';
    userInfoBox.classList.add('show');
    validate();
  });
});

// 2) 생년월일 입력 제한 (숫자만 + 8자리 고정)
birthInput.addEventListener('input', () => {
  // 숫자만 허용 + 8자리로 컷
  birthInput.value = birthInput.value.replace(/\D/g, '').slice(0, 8);
  validate();
});

nameInput.addEventListener('input', validate);

// 3) 입력 검증
function validate() {
  err.textContent = '';
  if (!selectedType) return disableStart();

  const name = nameInput.value.trim();
  const b = birthInput.value.trim();

  if (!name) return disableStart();
  if (!/^\d{8}$/.test(b)) {
    err.textContent = '생년월일은 8자리 숫자(YYYYMMDD)로 입력해주세요.';
    return disableStart();
  }

  // 날짜 유효성 검증
  const y = parseInt(b.slice(0,4),10);
  const m = parseInt(b.slice(4,6),10);
  const d = parseInt(b.slice(6,8),10);
  const nowY = new Date().getFullYear();
  if (y < 1900 || y > nowY) {
    err.textContent = '올바른 연도를 입력해주세요.';
    return disableStart();
  }
  if (m < 1 || m > 12) {
    err.textContent = '올바른 월(01-12)을 입력해주세요.';
    return disableStart();
  }
  const lastDay = new Date(y, m, 0).getDate();
  if (d < 1 || d > lastDay) {
    err.textContent = `해당 월의 일(01-${String(lastDay).padStart(2,'0')})을 입력해주세요.`;
    return disableStart();
  }

  startBtn.disabled = false;
}

function disableStart(){ startBtn.disabled = true; }

// 4) 응답 시작 -> survey.html 로 이동 (sessionStorage 사용)
startBtn.addEventListener('click', async () => {
  if (startBtn.disabled) return;

  loading.style.display = 'block';
  startBtn.disabled = true;

  const userInfo = {
    name: nameInput.value.trim(),
    birthDate: birthInput.value.trim(),
    candidateType: selectedType
  };

  sessionStorage.setItem('userInfo', JSON.stringify(userInfo));
  // survey.html(정적)로 이동 — FastAPI도 동일 파일명을 서빙하게 유지
  location.href = 'survey.html';
});
