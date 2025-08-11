// assets/js/main.js
// index.html 전용: 입력 검증 + 설문 페이지로 이동

(function () {
  const form = document.getElementById('applyForm');
  const errorEl = document.getElementById('formError');

  if (!form) return;

  function setError(msg) {
    if (errorEl) errorEl.textContent = msg || '';
  }

  function getSelectedType() {
    const el = form.querySelector('input[name="type"]:checked');
    return el ? el.value : null;
    }

  function isValidBirthISO(v) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
    const [y, m, d] = v.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const now = new Date();
    if (y < 1900 || y > now.getFullYear()) return false;
    if (dt.getFullYear() !== y || dt.getMonth() + 1 !== m || dt.getDate() !== d) return false;
    if (dt > now) return false;
    return true;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    setError('');

    const type = getSelectedType();
    const name = (form.name?.value || '').trim();
    const birth = form.birth?.value || '';

    // 검증
    if (!type) return setError('지원 유형을 선택해주세요.');
    if (!name) return setError('이름을 입력해주세요.');
    if (!birth) return setError('생년월일을 선택해주세요.');
    if (!isValidBirthISO(birth)) return setError('생년월일 형식이 올바르지 않습니다.');

    // 저장 후 이동
    try {
      localStorage.setItem('applyType', type);
      localStorage.setItem('applyName', name);
      localStorage.setItem('applyBirth', birth);
    } catch (_) {}

    // 설문 페이지로 이동
    window.location.href = 'survey.html';
  });
})();
