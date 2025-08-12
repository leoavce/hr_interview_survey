(function () {
  const surveyForm = document.getElementById('surveyForm');
  const questionsDiv = document.getElementById('questions');
  const titleEl = document.getElementById('surveyTitle');
  const infoEl = document.getElementById('candidateInfo');
  const errorEl = document.getElementById('errorMessage');
  const successBox = document.getElementById('successBox');

  const type = sessionStorage.getItem('applyType');
  const name = sessionStorage.getItem('applyName');
  const birth = sessionStorage.getItem('applyBirth');

  if (!type || !name || !birth) {
    location.href = 'index.html';
    return;
  }

  titleEl.textContent = `${type} 설문 응답`;
  infoEl.textContent = `${name} (${birth}) · ${type}`;

  // 서술형 질문
  const essayQuestions = {
    '신입': [
      '안랩에서 꿈꾸는 미래 포부 (희망하는 역할/목표)에 대해서 말씀해 주십시오.',
      '본인이 다른 사람과 구별되는 특별히 뛰어난 점 ①',
      '본인이 다른 사람과 구별되는 특별히 뛰어난 점 ②',
      '본인이 다른 사람과 구별되는 특별히 뛰어난 점 ③',
      '살아오면서 성취한 것 중 타인에게 자랑할 만한 것 ①',
      '살아오면서 성취한 것 중 타인에게 자랑할 만한 것 ②',
      '살아오면서 성취한 것 중 타인에게 자랑할 만한 것 ③',
      '지원 직무(부문)에서 성과를 내기 위해 필요한 역량은?',
      '본인의 역량 보유 수준 (점수/10점 만점)',
      '필요 역량을 갖추기 위해 어떤 노력을 해왔는지(키워드)',
      '타인이 인정(칭찬)하는 본인 성격(성향)상의 장점과 이유',
      '안랩 근무 기대요소 1순위',
      '안랩 근무 기대요소 2순위',
      '안랩 근무 기대요소 3순위',
      '안랩 근무 기대요소 4순위',
      '안랩 근무 기대요소 5순위',
      '안랩 근무 기대요소 6순위',
      '안랩 외 타사 진행상황',
      '희망 최저 연봉 (만원)',
      '희망 최고 연봉 (만원)'
    ],
    '경력': [
      '직장생활에서의 성공에 대한 정의',
      '본인 성격의 장점',
      '본인 성격의 단점',
      '본인이 다른 사람과 구별되는 특별히 뛰어난 점 ①',
      '본인이 다른 사람과 구별되는 특별히 뛰어난 점 ②',
      '본인이 다른 사람과 구별되는 특별히 뛰어난 점 ③',
      '나를 표현하는 단어 3가지',
      '가장 큰 성취 경험과 그 역할',
      '안랩 근무 기대요소 1순위',
      '안랩 근무 기대요소 2순위',
      '안랩 근무 기대요소 3순위',
      '안랩 근무 기대요소 4순위',
      '안랩 근무 기대요소 5순위',
      '안랩 근무 기대요소 6순위',
      '현재 연봉(기본급, 만원)',
      '희망 최저 연봉(만원)',
      '희망 최고 연봉(만원)'
    ]
  };

  // 선택형 40쌍
  const choicePairs = [
    ["나는 활동을 좋아한다.", "나는 문제를 체계적/조직적으로 다룬다."],
    ["나는 변화를 무척 좋아한다.", "나는 개인활동보다 팀 활동이 더 효과적이라고 믿는다."],
    ["나는 사람들과 함께 일하는 것을 즐긴다.", "나는 과거보다 미래에 관심이 더 많다."],
    ["마감일을 지키는 것이 중요하다.", "나는 조직이 잘된 그룹모임에 나가는 것을 좋아한다."],
    ["연기(미루는 것)를 견딜 수 없다.", "새 아이디어는 먼저 테스트 후 사용해야 한다고 믿는다."],
    ["늘 새로운 가능성을 찾아본다.", "사람들과 얘기하고 활동하는 것을 즐긴다."],
    ["나 자신의 목표를 세우기 원한다.", "한 가지 일을 시작하면 끝까지 해낸다."],
    ["주위 사람들에게 도전을 잘 한다.", "다른 사람들의 감정을 이해하려 노력한다."],
    ["내가 수행한 일에 대한 반응을 듣고 싶다.", "일을 한 단계씩 처리하는 것이 효율적이다."],
    ["사람들의 생각을 잘 알아차린다.", "창의력을 발휘해 문제 해결하는 것을 좋아한다."],
    ["항상 미래에 대해 생각한다.", "다른 사람들의 필요에 민감하다."],
    ["계획은 성공의 열쇠다.", "오래 숙고하는 것을 보면 힘들어진다."],
    ["압력 속에서 침착하다.", "경험을 매우 중시한다."],
    ["사람들에게 귀를 기울인다.", "사람들은 내가 생각의 회전을 잘한다고 한다."],
    ["협력이 가장 중요하다.", "대안을 시험하기 위해 논리적 방법을 사용한다."],
    ["항상 스스로 질문한다.", "한꺼번에 여러 가지 일을 다루는 것을 좋아한다."],
    ["실제로 해 보며 배운다.", "머리가 마음을 지배한다고 믿는다."],
    ["자세한 것을 싫어한다.", "사람들의 반응을 예측할 수 있다."],
    ["행동 전에 반드시 분석한다.", "그룹의 분위기를 알아차릴 수 있다."],
    ["결정을 확실하게 잘 내린다.", "일을 시작하고 끝내지 않는 경향이 있다."],
    ["도전적인 일을 찾아서 한다.", "관찰과 통계자료를 신뢰한다."],
    ["감정을 외적으로 표현할 수 있다.", "새로운 일을 설계하기 좋아한다."],
    ["독서를 매우 즐긴다.", "나 자신을 조력자라고 생각한다."],
    ["한 번에 한 가지만 집중한다.", "성취하는 것을 좋아한다."],
    ["다른 사람들에 대해 배우는 것을 좋아한다.", "다양한 것을 좋아한다."],
    ["사실은 스스로 말한다.", "상상력을 가능한 한 많이 사용한다."],
    ["오래 걸리고 진척 느린 일을 싫어한다.", "생각을 쉴 새 없이 한다."],
    ["중요한 결정은 조심스럽게 내린다.", "일을 수행하려면 서로 도와야 한다고 믿는다."],
    ["별로 깊이 생각하지 않고 흔히 결정을 내린다.", "감정은 문제를 일으킨다."],
    ["사람들이 나를 좋아하면 기분이 좋다.", "생각이 잘 돌아간다."],
    ["사람들에게 새로운 아이디어를 시도한다.", "과학적 접근 방식을 믿는다."],
    ["일이 되게 하는 것을 좋아한다.", "좋은 대인관계는 필수적이다."],
    ["나는 충동적이다.", "사람들의 차이점을 용납한다."],
    ["지적으로 자극되는 것을 좋아한다.", "커뮤니케이션 자체가 목적이다."],
    ["조직하는 것을 좋아한다.", "이 일 저 일 하는 경향이 있다."],
    ["자기성취는 매우 중요하다.", "사람들과 이야기하고 일하는 것은 창조적이다."],
    ["아이디어 내는 것을 즐긴다.", "시간 낭비를 싫어한다."],
    ["내가 잘하는 일을 하길 즐긴다.", "다른 사람들과의 상호교류로 배운다."],
    ["자세한 것을 잘 참는다.", "추상적인 것이 즐겁다."],
    ["간결하고 핵심을 찌르는 말을 좋아한다.", "자신에 대해 자신감이 있다."]
  ];

  function renderQuestions() {
    // 서술형
    essayQuestions[type].forEach((q, i) => {
      const wrap = document.createElement('div');
      wrap.className = 'q essay';
      wrap.innerHTML = `
        <label class="q-label">${i + 1}. ${q}</label>
        <textarea name="essay${i+1}" required></textarea>
      `;
      questionsDiv.appendChild(wrap);
    });
    // 선택형
    choicePairs.forEach((pair, idx) => {
      const wrap = document.createElement('div');
      wrap.className = 'q choice';
      wrap.innerHTML = `
        <div class="choice-head">문항 ${idx + 1}/40</div>
        <div class="choice-body">
          <label class="choice-option">
            <input type="radio" name="select${idx+1}" value="1" required>
            <span>${pair[0]}</span>
          </label>
          <label class="choice-option">
            <input type="radio" name="select${idx+1}" value="2">
            <span>${pair[1]}</span>
          </label>
        </div>
      `;
      questionsDiv.appendChild(wrap);
    });
  }

  // 분류 로직
  function getTypeScores(surveyAnswers) {
    const typeQuestions = {
      "A": [1,7,9,13,17,24,26,32,33,39,41,48,50,53,57,63,65,70,74,79],
      "B": [2,8,10,14,18,23,25,30,34,37,42,47,51,55,58,62,66,69,75,77],
      "C": [4,5,12,16,19,22,27,29,36,38,43,46,49,56,59,64,68,72,76,80],
      "D": [3,6,11,15,20,21,28,31,35,40,44,45,52,54,60,61,67,71,73,78]
    };
    const scores = {A:0,B:0,C:0,D:0};
    surveyAnswers.forEach((ans, i) => {
      const q1 = i*2 + 1;
      const q2 = i*2 + 2;
      const selected = ans === 1 ? q1 : ans === 2 ? q2 : null;
      if(!selected) return;
      for(const t in typeQuestions){
        if(typeQuestions[t].includes(selected)){ scores[t]++; break; }
      }
    });
    return scores;
  }
  function classifyType(surveyAnswers){
    const scores = getTypeScores(surveyAnswers);
    const max = Math.max(scores.A, scores.B, scores.C, scores.D);
    if(max === 0) return {label: '균형형', scores};
    const order = ['A','B','C','D'];
    for(const t of order){
      if(scores[t] === max) return {label: `${t}형 (${scores[t]}개)`, scores};
    }
    return {label: '균형형', scores};
  }

  renderQuestions();

  surveyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.style.display = 'none';

    // 버튼 상태 변경
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '제출 중...';

    try {
      // Firebase 준비(익명 인증)
      await window.ensureFirebaseReady?.();

      // 수집
      const essays = [];
      const essayLen = essayQuestions[type].length;
      for(let i=0;i<essayLen;i++){
        const v = (surveyForm[`essay${i+1}`]?.value || '').trim();
        if(!v){ throw new Error(`서술형 ${i+1}번을 입력해주세요.`); }
        essays.push(v);
      }
      const selects = [];
      for(let i=0;i<40;i++){
        const v = surveyForm[`select${i+1}`]?.value;
        if(!v){ throw new Error(`선택형 ${i+1}번을 선택해주세요.`); }
        selects.push(parseInt(v,10));
      }

      // 분류
      const result = classifyType(selects);

      // 저장 데이터 (응답자 측에서는 절대 PDF 생성/다운로드/업로드 안 함)
      const docData = {
        type,
        name,
        birth,
        essays,
        selects,
        resultType: result.label,
        typeScores: result.scores,
        date: new Date().toISOString(),
        // 응답자 페이지: PDF 생성 금지 플래그 (관리자 참고용)
        pdfCreated: false
      };

      // Firestore 저장
      await db.collection('responses').add(docData);

      // 완료 표시 (PDF 미생성, 다운로드 없음)
      surveyForm.style.display = 'none';
      successBox.style.display = 'block';
    } catch (err) {
      errorEl.textContent = (err && err.message) ? `제출 중 오류: ${err.message}` : '제출 중 오류가 발생했습니다.';
      errorEl.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
})();
