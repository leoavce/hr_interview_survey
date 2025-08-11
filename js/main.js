// js/main.js
(function () {
  const typeButtons = document.querySelectorAll('.btn.type');
  const form = document.getElementById('applyForm');
  const nameInput = document.getElementById('name');
  const birthInput = document.getElementById('birth');
  const startBtn = document.getElementById('startBtn');
  const errorBox = document.getElementById('errorMessage');

  let selectedType = null;

  // 타입 선택
  typeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      typeButtons.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedType = btn.getAttribute('data-type');
      validate();
    });
  });

  // 숫자/길이 제한 (YYYYMMDD)
  birthInput.addEventListener('input', (e) => {
    // 숫자만
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 8);
    validate();
  });

  nameInput.addEventListener('input', validate);

  function validate() {
    errorBox.style.display = 'none';
    const name = nameInput.value.trim();
    const birth = birthInput.value.trim();

    if (!selectedType || !name || !birth) {
      startBtn.disabled = true;
      return;
    }
    if (!/^\d{8}$/.test(birth)) {
      startBtn.disabled = true;
      return;
    }
    const year = parseInt(birth.slice(0, 4), 10);
    const month = parseInt(birth.slice(4, 6), 10);
    const day = parseInt(birth.slice(6, 8), 10);
    const nowYear = new Date().getFullYear();

    if (year < 1900 || year > nowYear) { startBtn.disabled = true; return; }
    if (month < 1 || month > 12) { startBtn.disabled = true; return; }
    if (day < 1 || day > 31) { startBtn.disabled = true; return; }

    startBtn.disabled = false;
  }

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
