// Survey page (backend 우선, 실패 시 Firebase로 fallback)

const choicePairs = [
  ["나는 활동을 좋아한다.","나는 문제를 체계적/조직적으로 다룬다."],
  ["나는 변화를 무척 좋아한다.","나는 개인활동보다 팀 활동이 더 효과적이라고 믿는다."],
  ["나는 사람들과 함께 일하는 것을 즐긴다.","나는 과거보다 미래에 관심이 더 많다."],
  ["마감일(Deadlines)을 지키는 것이 내게는 중요하다.","나는 조직이 잘된 그룹모임에 나가는 것을 좋아한다."],
  ["연기하는 것(미루는 것)을 나는 견디할 수 없다.","새로운 아이디어는 먼저 테스트해 본 후에 사용해야 한다고 나는 믿는다."],
  ["무슨 일이든지 나는 늘 새로운 가능성을 찾아본다.","나는 다른 사람들과 얘기하고 활동하는 것을 즐긴다."],
  ["나는 나 자신의 목표를 세우기 원한다.","한가지 일을 시작하면 나는 끝까지 해내는 것을 좋아한다."],
  ["나는 주위 사람들에게 도전을 잘 한다.","나는 기본적으로 다른 사람들의 감정을 이해하려고 노력한다."],
  ["나는 내가 수행한 일에 대한 결과/반응을 듣기를 기대한다.","나는 일을 한단계씩 처리해 나가는 것이 효율적이라고 생각한다."],
  ["나는 사람들의 생각을 잘 알아차리는 편이다.","나는 창의력을 발휘하여 문제해결 하는 것을 좋아한다."],
  ["나는 항상 미래에 대해 생각한다.","나는 다른 사람들의 필요에 민감하다."],
  ["계획은 성공의 열쇠이다.","나는 오래 생각하고 숙고하는 것을 보면 견디기가 힘들어진다."],
  ["나는 압력 속에서 침착하다.","나는 경험을 매우 중시한다."],
  ["나는 사람들에게 귀를 기울인다.","사람들은 내가 생각의 회전을 잘한다고 한다."],
  ["협력은 내게 가장 중요한 단어이다.","나는 대안을 시험하기 위해서 논리적인 방법을 사용한다."],
  ["나는 항상 스스로 질문을 해본다.","나는 한꺼번에 여러가지 일을 다루는 것을 좋아한다."],
  ["나는 실제로 무엇을 해 봄으로써 배운다.","나는 내 머리가 내 마음을 지배한다고 믿는다."],
  ["나는 자세한 것을 싫어한다.","나는 사람들이 어떤 행동에 어떻게 반응할 것인가를 예측할 수 있다."],
  ["나는 행동하기 전에 반드시 분석을 해 보아야 한다.","나는 어떤 그룹의 분위기를 알아차릴 수 있다."],
  ["나는 나 자신이 무슨 일에나 결정을 확실하게 잘 내린다고 생각한다.","나는 일을 시작하고 끝내지 않는 경향이 있다."],
  ["나는 도전적인 일 (힘든 일)을 찾아서 한다.","나는 관찰과 통계자료를 신뢰한다."],
  ["나는 내 감정을 외적으로 표현할 수 있다.","나는 새로운 일을 설계하기 좋아한다."],
  ["나는 독서를 매우 즐긴다.","나는 나 자신을 조력자(helper)라고 생각한다."],
  ["나는 한번에 한가지씩만 집중해서 하는 것을 좋아한다.","나는 성취하는 것을 좋아한다."],
  ["나는 다른 사람들에 대해 배우는 것을 좋아한다.","나는 다양한 것을 좋아한다."],
  ["'사실(facts)'은 스스로 말한다.(명확하다.)","나는 상상력을 가능한 한 많이 사용한다."],
  ["나는 오래 걸리고 진척이 느린 일들을 싫어한다.","나는 생각을 쉴새 없이 한다."],
  ["중요한 결정은 조심스럽게 내려야 한다.","나는 일을 수행하기 위해서는 서로 도와야한다고 굳게 믿고 있다."],
  ["나는 별로 깊이 생각하지 않고 흔히 결정을 내린다.","감정은 문제를 일으킨다."],
  ["사람들이 나를 좋아하면 기분이 좋다.","나는 생각이 잘 돌아간다."],
  ["나는 사람들에게 나의 새로운 아이디어를 시도한다.","나는 과학적인 접근방식을 믿는다."],
  ["나는 일이 되게 하는 것을 좋아한다.","좋은 대인관계는 필수적이다."],
  ["나는 충동적이다.","나는 사람들의 차이점을 용납한다."],
  ["나는 지적으로 자극되는 것을 좋아한다.","사람들과 커뮤니케이션 하는 것 자체가 목적이다."],
  ["나는 조직하는 것을 좋아한다.","나는 흔히 이 일을 했다, 저 일을 했다 하는 경향이 있다."],
  ["자기성취는 나에게 매우 중요하다.","사람들과 더불어 이야기하고 일하는 것은 창조적인 행위이다."],
  ["나는 아이디어 내는 것을 즐긴다. (나는 여러가지 생각하기를 즐긴다.)","나는 시간 낭비하는 것을 싫어한다."],
  ["나는 내가 잘하는 일을 하기를 즐긴다.","나는 다른 사람들과의 상호교류를 통해 배운다."],
  ["나는 자세한 것을 잘 참는다.","나는 추상적인 것이 재미있고 즐겁다."],
  ["나는 간결하고 핵심을 찌르는 말을 좋아한다.","나는 나 자신에 대해 자신감을 갖고 있다."]
];

let candidateType = '';
const surveyForm = document.getElementById('surveyForm');
const shortQuestionsEl = document.getElementById('shortQuestions');
const choiceQuestionsEl = document.getElementById('choiceQuestions');
const shortCountEl = document.getElementById('shortCount');

function showError(msg){
  const el = document.getElementById('errorMessage');
  el.textContent = msg;
  el.style.display = 'block';
}
function hideError(){ document.getElementById('errorMessage').style.display='none'; }
function showSuccess(){
  surveyForm.style.display = 'none';
  hideError();
  document.getElementById('successMessage').style.display = 'block';
}
function goBack(){ sessionStorage.clear(); location.href = 'index.html'; }
function goHome(){ sessionStorage.clear(); location.href = 'index.html'; }
window.goBack = goBack; window.goHome = goHome;

// 로드
document.addEventListener('DOMContentLoaded', init);
function init(){
  const info = sessionStorage.getItem('userInfo');
  if(!info){ showError('필수 정보가 누락되었습니다. 홈으로 돌아가주세요.'); return; }
  const {name, birthDate, candidateType: ct} = JSON.parse(info);
  candidateType = ct;
  document.getElementById('candidateInfo').textContent = `${name}님 (${birthDate}) - ${candidateType}`;

  renderShortQuestions(candidateType);
  renderChoiceQuestions();
  surveyForm.style.display = 'block';
}

function renderShortQuestions(type){
  // 신입 20, 경력 17 — 디자인은 레퍼런스 기반
  const templateNew = [
    {label:'1. 안랩에서 꿈꾸는 미래 포부 (희망하는 역할/목표)에 대해서 말씀해 주십시오.', key:0},
    {label:'2. 본인이 다른 사람과 구별되는 특별히 뛰어난 점이 있다면 최대 3가지 소개해 주십시오. (①, ②, ③)', keys:[1,2,3]},
    {label:'3. 살아오면서 자랑할 만한 성취 3가지 (①, ②, ③)', keys:[4,5,6]},
    {label:'4-1. 지원 직무에서 성과를 위해 필요한 역량', key:7},
    {label:'4-2. 본인의 역량 보유 수준 (10점 만점)', key:8, type:'number'},
    {label:'4-3. 역량을 갖추기 위한 노력(키워드 중심)', key:9},
    {label:'5. 타인이 인정하는 성격상 장점과 이유', key:10},
    {label:'6. 안랩 근무 기대요소 ①~⑥', keys:[11,12,13,14,15,16], type:'rank'},
    {label:'7. 타사 진행 상황', key:17},
    {label:'8. 희망 연봉 최저/최고 (만원)', keys:[18,19], type:'salary'}
  ];
  const templateExp = [
    {label:'1. 직장생활에서의 성공 정의', key:0},
    {label:'2-1. 성격의 장점', key:1},
    {label:'2-2. 성격의 단점', key:2},
    {label:'3. 특별히 뛰어난 점 3가지 (①, ②, ③)', keys:[3,4,5]},
    {label:'4. 나를 표현하는 단어 3가지', key:6},
    {label:'5. 가장 큰 성취 경험과 역할', key:7},
    {label:'6. 안랩 근무 기대요소 ①~⑥', keys:[8,9,10,11,12,13], type:'rank'},
    {label:'7. 현재연봉/희망연봉 (만원)', keys:[14,15,16], type:'salary3'}
  ];

  const tpl = (type==='신입지원') ? templateNew : templateExp;
  shortCountEl.textContent = (type==='신입지원') ? 20 : 17;

  shortQuestionsEl.innerHTML = '';
  tpl.forEach(item=>{
    const wrap = document.createElement('div');
    wrap.className = 'question-group';

    const label = document.createElement('label');
    label.textContent = item.label;
    wrap.appendChild(label);

    if (item.key !== undefined){
      if(item.type==='number'){
        const input = document.createElement('input');
        input.name = `short_${item.key}`;
        input.type = 'number';
        input.min = 1; input.max = 10;
        input.required = true;
        input.className = 'form-input';
        input.style = 'width:120px;padding:.6rem;border:1px solid #e5e7eb;border-radius:6px;';
        wrap.appendChild(input);
      }else{
        const ta = document.createElement('textarea');
        ta.name = `short_${item.key}`;
        ta.required = true;
        wrap.appendChild(ta);
      }
    }else if(item.keys){
      if (item.type==='rank'){
        const row1 = document.createElement('div');
        row1.style = 'display:flex;gap:1rem;flex-wrap:wrap;';
        item.keys.forEach(k=>{
          const col = document.createElement('div');
          col.style='flex:1;min-width:180px;';
          const input = document.createElement('input');
          input.name = `short_${k}`;
          input.required = true;
          input.placeholder = '항목';
          input.className='form-input';
          input.style='width:100%;padding:.6rem;border:1px solid #e5e7eb;border-radius:6px;';
          col.appendChild(input);
          row1.appendChild(col);
        });
        wrap.appendChild(row1);
      }else if(item.type==='salary'){
        const row = document.createElement('div');
        row.style='display:flex;gap:.5rem;align-items:center;flex-wrap:wrap;';
        const minI = document.createElement('input');
        minI.type='number'; minI.name=`short_${item.keys[0]}`; minI.required=true; minI.style='max-width:120px;padding:.6rem;border:1px solid #e5e7eb;border-radius:6px;';
        const maxI = document.createElement('input');
        maxI.type='number'; maxI.name=`short_${item.keys[1]}`; maxI.required=true; maxI.style='max-width:120px;padding:.6rem;border:1px solid #e5e7eb;border-radius:6px;';
        row.innerHTML = `<span>최저</span>`;
        row.appendChild(minI);
        row.innerHTML += `<span>(만원) ~ 최고</span>`;
        row.appendChild(maxI);
        row.innerHTML += `<span>(만원)</span>`;
        wrap.appendChild(row);
      }else if(item.type==='salary3'){
        const box = document.createElement('div');
        box.style='background:#f8fafc;padding:1rem;border-radius:8px;border:1px solid #e5e7eb;';
        box.innerHTML = `
          <div style="margin-bottom:1rem;">
            <label style="display:block;margin-bottom:.3rem;">현재연봉(기본급)</label>
            <input type="number" name="short_${item.keys[0]}" required style="max-width:120px;padding:.6rem;border:1px solid #e5e7eb;border-radius:6px;">
            <span>(만원)</span>
          </div>
          <div>
            <label style="display:block;margin-bottom:.3rem;">희망연봉</label>
            <span>최저</span>
            <input type="number" name="short_${item.keys[1]}" required style="max-width:120px;padding:.6rem;border:1px solid #e5e7eb;border-radius:6px;">
            <span>(만원) ~ 최고</span>
            <input type="number" name="short_${item.keys[2]}" required style="max-width:120px;padding:.6rem;border:1px solid #e5e7eb;border-radius:6px;">
            <span>(만원)</span>
          </div>`;
        wrap.appendChild(box);
      }else{
        item.keys.forEach(k=>{
          const ta = document.createElement('textarea');
          ta.name = `short_${k}`;
          ta.required = true;
          wrap.appendChild(ta);
        });
      }
    }

    shortQuestionsEl.appendChild(wrap);
  });
}

function renderChoiceQuestions(){
  choiceQuestionsEl.innerHTML='';
  choicePairs.forEach((pair, idx)=>{
    const div = document.createElement('div');
    div.className='choice-pair';
    div.innerHTML = `
      <div class="choice-pair-header">문항 ${idx+1}/40</div>
      <div class="choice-options">
        <label class="choice-option">
          <input type="radio" name="choice_${idx}" value="1" style="display:none;">
          <span>${pair[0]}</span>
        </label>
        <label class="choice-option">
          <input type="radio" name="choice_${idx}" value="2" style="display:none;">
          <span>${pair[1]}</span>
        </label>
      </div>`;
    choiceQuestionsEl.appendChild(div);

    // 선택 스타일
    div.querySelectorAll('label.choice-option').forEach(lbl=>{
      lbl.addEventListener('click', ()=>{
        div.querySelectorAll('label.choice-option').forEach(x=>x.classList.remove('selected'));
        lbl.classList.add('selected');
        lbl.querySelector('input').checked = true;
      });
    });
  });
}

// 제출 처리 (백엔드 우선 -> 실패 시 Firebase)
surveyForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  hideError();

  const info = JSON.parse(sessionStorage.getItem('userInfo')||'{}');
  if(!info.name || !info.birthDate){ showError('필수 정보가 누락되었습니다.'); return; }

  // 서술형 수집(존재하는 필드만)
  const shortAnswers = [];
  for (let i=0;i<20;i++){
    const el = document.querySelector(`[name="short_${i}"]`);
    if(!el) break;
    if(!String(el.value||'').trim()){ showError(`서술형 질문 ${i+1}번에 응답해주세요.`); return; }
    shortAnswers.push(String(el.value).trim());
  }

  // 선택형 40 수집
  const surveyAnswers = [];
  for (let i=0;i<40;i++){
    const v = new FormData(surveyForm).get(`choice_${i}`);
    if(!v){ showError(`선택형 질문 ${i+1}번에 응답해주세요.`); return; }
    surveyAnswers.push(parseInt(v,10));
  }

  const payload = {
    name: info.name,
    birth_date: info.birthDate,
    candidate_type: candidateType,
    short_answers: shortAnswers,
    survey_answers: surveyAnswers
  };

  const btn = document.getElementById('submitBtn');
  btn.disabled = true; btn.textContent = '제출 중...';

  // 백엔드 모드 판단
  const useBackend = location.origin.includes('localhost') || location.origin.includes('127.0.0.1');

  try{
    if(useBackend){
      const res = await fetch('/submit-response', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if(!res.ok) throw new Error(data.detail || '제출 실패');
      showSuccess(); // 결과는 응답자에게 미노출(요청사항)
    }else{
      // Firebase 저장 (GitHub Pages 모드)
      await db.collection('responses').add({
        type: candidateType === '신입지원' ? '신입' : '경력',
        name: info.name,
        birth: info.birthDate,
        essays: shortAnswers,
        selects: surveyAnswers.map(v => (v===1?'A':'B')), // 기존 구조 유지(A/B)
        date: new Date().toISOString()
      });
      showSuccess();
    }
  }catch(err){
    console.error(err);
    showError('제출 중 오류가 발생했습니다: ' + err.message);
    btn.disabled=false; btn.textContent='설문 제출';
  }
});
