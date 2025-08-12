// js/main.js
(function () {
  const typeButtons = document.querySelectorAll('.btn.type');
  const form = document.getElementById('applyForm');
  const nameInput = document.getElementById('name');
  const birthInput = document.getElementById('birth');
  const startBtn = document.getElementById('startBtn');
  const errorBox = document.getElementById('errorMessage');

  let selectedType = null;

  // 신입/경력 버튼 클릭 시 파란 하이라이트 + 선택 저장
  typeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      // 모두 해제
      typeButtons.forEach(b => b.classList.remove('selected'));
      // 클릭한 것만 선택
      btn.classList.add('selected');
      selectedType = btn.getAttribute('data-type') || null;
      validateForm();
    });
  });

  // 생년월일 숫자 8자리 제한 (YYYYMMDD)
  birthInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 8);
    validateForm();
  });

  // 이름 변경 시 검증
  nameInput.addEventListener('input', validateForm);

  function validateForm() {
    errorBox.style.display = 'none';
    const name = nameInput.value.trim();
    const birth = birthInput.value.trim();

    // 필수값 확인
    if (!selectedType || !name || !birth) {
      startBtn.disabled = true;
      return;
    }

    // 형식 확인
    if (!/^\d{8}$/.test(birth)) {
      startBtn.disabled = true;
      return;
    }

    // 날짜 유효성(대략)
    const year = parseInt(birth.slice(0, 4), 10);
    const month = parseInt(birth.slice(4, 6), 10);
    const day = parseInt(birth.slice(6, 8), 10);
    const nowYear = new Date().getFullYear();

    if (year < 1900 || year > nowYear) { startBtn.disabled = true; return; }
    if (month < 1 || month > 12) { startBtn.disabled = true; return; }
    if (day < 1 || day > 31) { startBtn.disabled = true; return; }

    startBtn.disabled = false;
  }

  // 제출 → 세션 저장 → 설문 페이지로 이동
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const birth = birthInput.value.trim();

    if (!selectedType || !name || !/^\d{8}$/.test(birth)) {
      errorBox.textContent = '입력값을 다시 확인해주세요.';
      errorBox.style.display = 'block';
      return;
    }

    sessionStorage.setItem('applyType', selectedType);
    sessionStorage.setItem('applyName', name);
    sessionStorage.setItem('applyBirth', birth);

    location.href = 'survey.html';
  });
})();
