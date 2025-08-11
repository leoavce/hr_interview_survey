// survey.html 설문 문항 및 제출 처리
const surveyForm = document.getElementById('surveyForm');
const questionsDiv = document.getElementById('questions');
const type = localStorage.getItem('applyType');
const name = localStorage.getItem('applyName');
const birth = localStorage.getItem('applyBirth');

// 신입/경력별 서술형 질문
const essayQuestions = {
  '신입': [
    '신입 지원 동기를 서술하세요.',
    '본인의 강점은 무엇인가요?'
  ],
  '경력': [
    '경력 지원 동기를 서술하세요.',
    '이전 직무에서의 주요 성과를 서술하세요.'
  ]
};

// 공통 선택형 40문항 (하드코딩)
const selectQuestions = Array.from({length: 40}, (_, i) => `선택형 질문 ${i+1}`);

function renderQuestions() {
  // 서술형
  essayQuestions[type].forEach((q, idx) => {
    const label = document.createElement('label');
    label.textContent = q;
    const textarea = document.createElement('textarea');
    textarea.name = `essay${idx+1}`;
    textarea.required = true;
    questionsDiv.appendChild(label);
    questionsDiv.appendChild(textarea);
  });
  // 선택형
  selectQuestions.forEach((q, idx) => {
    const div = document.createElement('div');
    div.innerHTML = `<span>${idx+1}. ${q}</span><br>
      <label><input type="radio" name="select${idx+1}" value="A" required> A</label>
      <label><input type="radio" name="select${idx+1}" value="B"> B</label>`;
    questionsDiv.appendChild(div);
  });
}

if(surveyForm && questionsDiv && type) {
  document.getElementById('surveyTitle').textContent = `${type} 설문 응답`;
  renderQuestions();
  surveyForm.addEventListener('submit', function(e) {
    e.preventDefault();
    // 응답 수집
    const data = {
      type, name, birth,
      essays: [],
      selects: [],
      date: new Date().toISOString()
    };
    essayQuestions[type].forEach((_, idx) => {
      data.essays.push(surveyForm[`essay${idx+1}`].value);
    });
    selectQuestions.forEach((_, idx) => {
      data.selects.push(surveyForm[`select${idx+1}`].value);
    });
    // 유형별 선택 개수 표시
    const typeCount = {A:0, B:0};
    data.selects.forEach(v => typeCount[v]++);
    alert(`A 유형: ${typeCount.A}개, B 유형: ${typeCount.B}개 선택됨`);
    // Firebase 저장
    db.collection('responses').add(data).then(() => {
      window.location.href = 'complete.html';
    }).catch(() => {
      alert('저장 실패');
    });
  });
}
