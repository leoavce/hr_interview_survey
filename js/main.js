// index.html 지원자 정보 처리
const form = document.getElementById('applyForm');
if(form) {
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const type = form.type.value;
    const name = form.name.value.trim();
    const birth = form.birth.value;
    // 생년월일 검증
    const birthYear = parseInt(birth.split('-')[0]);
    const nowYear = new Date().getFullYear();
    if(birthYear < 1900 || birthYear > nowYear) {
      alert('생년월일을 올바르게 입력하세요.');
      return;
    }
    // 정보 저장 (localStorage)
    localStorage.setItem('applyType', type);
    localStorage.setItem('applyName', name);
    localStorage.setItem('applyBirth', birth);
    window.location.href = 'survey.html';
  });
}
