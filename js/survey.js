// js/survey.js
(function () {
  const surveyForm   = document.getElementById('surveyForm');
  const titleEl      = document.getElementById('surveyTitle');
  const infoEl       = document.getElementById('candidateInfo');
  const errorEl      = document.getElementById('errorMessage');
  const successBox   = document.getElementById('successBox');

  const essaySection  = document.getElementById('essaySection');
  const choiceSection = document.getElementById('choiceSection');

  // 세션에서 지원자 정보
  const type  = sessionStorage.getItem('applyType'); // "신입" / "경력"
  const name  = sessionStorage.getItem('applyName');
  const birth = sessionStorage.getItem('appl표에 대해서 말씀해 주십시오.</label>
        <textarea name="n_dream" required placeholder="목표를 구체적으로 기술해주세요"></textarea>
      </div>

      <div class="q">
        <label class="q-label">2. 본인의 개성에 대해 소개해 주십시오.</label>
        <div class="grid-1">
          <textarea name="n_strength1" required placeholder="개성 첫 번째"></textarea>
          <textarea name="n_strength2" placeholder="개성 두 번째 (선택사항)"></textarea>
          <textarea name="n_strength3" placeholder="개성성 세 번째 (선택사항)"></textarea>
        </div>
      </div>

      <div class="q">
        <label class="q-label">3. 타인에게 자랑할 만한 것을 3가지 소개해 주십시오.</label>
        <div class="grid-1">
          <textarea name="n_ach1" required placeholder="자랑할 만한 것 첫 번째"></textarea>
          <textarea name="n_ach2" required placeholder="자랑할 만한 것 두 번째"></textarea>
          <textarea name="n_ach3" required placeholder="자랑할 만한 것 세 번째"></textarea>
        </div>
      </div>

      <div class="q">
        <label class="q-label">4. 지원 직무(부문)에서 성과를 내기 위해 필요한 역량이 무엇이라고 생각하시는지 기술해 주십시오.</label>
        <textarea name="n_comp_needed" required placeholder="필요한 역량을 구체적으로 기술해주세요"></textarea>

        <div style="margin-top:10px;">
          <label class="q-label">본인의 역량 보유 수준 (10점 만점)</label>
          <input type="number" min="0" max="10" step="1" name="n_comp_score" required placeholder="0~10" style="width:120px;">
        </div>

        <div style="margin-top:10px;">
          <label class="q-label">필요 역량을 갖추기 위해 어떤 과정(노력)을 통해 역량을 갖춰왔는지 Key Word 중심 설명</label>
          <textarea name="n_comp_effort" required placeholder="역량 개발 과정을 키워드 중심으로 설명해주세요"></textarea>
        </div>
      </div>

      <div class="q">
        <label class="q-label">5. 타인이 인정(칭찬)하는 본인 성격(성향)상의 장점과 그 이유를 기술해주십시오.</label>
        <textarea name="n_personality_strength" required placeholder="타인이 인정하는 성격상 장점과 이유를 구체적으로 기술해주세요"></textarea>
      </div>

      <div class="q">
        <label class="q-label">6. 다음 보기 중에서 근무를 통해서 기대하는 것을 중요한 순서대로 나열해 주십시오.</label>
        <div class="info">보기) a, b, c d, e, f</div>
        <div class="grid-3">
          <input name="n_expect1" required placeholder="1순위">
          <input name="n_expect2" required placeholder="2순위">
          <input name="n_expect3" required placeholder="3순위">
          <input name="n_expect4" required placeholder="4순위">
          <input name="n_expect5" required placeholder="5순위">
          <input name="n_expect6" required placeholder="6순위">
        </div>
      </div>

      <div class="q">
        <label class="q-label">7. 현재 최종면접이 진행중이거나 합격한 회사가 있습니까?</label>
        <textarea name="n_otheroffers" required placeholder="예: A사 최종합격, B사 2차면접 진행 중 등 (없으면 '없음')"></textarea>
      </div>

      <div class="q">
        <label class="q-label">8. 희망연봉은?</label>
        <div class="salary-inline-new">
          <span class="label">최저</span>
          <input type="number" name="n_salary_min" required placeholder="0">
          <span class="label">~</span>
          <span class="label">최고</span>
          <input type="number" name="n_salary_max" required placeholder="0">
          <span class="label">(만원)</span>
        </div>
      </div>
    `;
  }

  function renderEssaysForExp() {
    essaySection.innerHTML = `
      <div class="q">
        <label class="q-label">1. 직장생활에서의 성공에 대해서 정의해 보십시오.</label>
        <textarea name="e_success" required placeholder="직장생활에서의 성공에 대한 정의를 입력해주세요"></textarea>
      </div>

      <div class="q">
        <label class="q-label">2. 본인 성격의 장/단점에 대해 각각 간략하게 기입해 주십시오.</label>
        <textarea name="e_pros" required placeholder="#장점 - 내용을 입력해주세요"></textarea>
        <textarea name="e_cons" required placeholder="#단점 - 내용을 입력해주세요" style="margin-top:8px;"></textarea>
      </div>

      <div class="q">
        <label class="q-label">3. 본인이 다른 사람과 구별되는 특별히 뛰어난 점이 있다면 세가지 정도 기입해 주십시오.</label>
        <div class="grid-1">
          <textarea name="e_strength1" required placeholder="1.뛰어난 점 첫 번째"></textarea>
          <textarea name="e_strength2" required placeholder="2.뛰어난 점 두 번째"></textarea>
          <textarea name="e_strength3" required placeholder="3.뛰어난 점 세 번째"></textarea>
        </div>
      </div>

      <div class="q">
        <label class="q-label">4. 나를 표현하는 단어 3가지를 기입해 주십시오.</label>
        <textarea name="e_words" required placeholder="나를 표현하는 단어 3가지를 간략히 입력해주세요"></textarea>
      </div>

      <div class="q">
        <label class="q-label">5. 가장 큰 성취를 했던 경험과 그 때 본인이 맡았던 역할을 기술해 주십시오.</label>
        <textarea name="e_bigach" required placeholder="성취 경험과 역할을 구체적으로 기술해주세요"></textarea>
      </div>

      <div class="q">
        <label class="q-label">6. 다음 보기 중에서 안랩 근무를 통해서 기대하는 것을 중요한 순서대로 나열해 주십시오.</label>
        <div class="info">보기) a, b, c, d, e, f</div>
        <div class="grid-3">
          <input name="e_expect1" required placeholder="1순위">
          <input name="e_expect2" required placeholder="2순위">
          <input name="e_expect3" required placeholder="3순위">
          <input name="e_expect4" required placeholder="4순위">
          <input name="e_expect5" required placeholder="5순위">
          <input name="e_expect6" required placeholder="6순위">
        </div>
      </div>

      <div class="q">
        <label class="q-label">7. 연봉 정보를 기입해 주십시오.</label>
        <div class="grid-1">
          <div>
            <span>현재연봉은? (기본급)</span>
            <div style="margin-top:6px;">
              <input type="number" name="e_salary_now" required placeholder="0" class="salary-input"> (만원)
            </div>
          </div>
          <div style="margin-top:8px;">
            <span>희망연봉은?</span>
            <div class="salary-inputs">
              <span class="muted">최저</span>
              <input type="number" name="e_salary_min" required placeholder="0" class="salary-input">
              <span class="muted">~ 최고</span>
              <input type="number" name="e_salary_max" required placeholder="0" class="salary-input">
              <span class="muted">(만원)</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ========= 렌더링 =========
  if (type === '신입') renderEssaysForNew();
  else renderEssaysForExp();

  // 선택형 렌더링
  choiceSection.innerHTML = choicePairs.map((pair, i) => {
    return `
      <div class="choice-pair">
        <div class="choice-pair-header">문항 ${i + 1}/40</div>
        <div class="choice-options">
          <label class="choice-option">
            <input type="radio" name="select${i+1}" value="1" required>
            <span>${pair[0]}</span>
          </label>
          <label class="choice-option">
            <input type="radio" name="select${i+1}" value="2">
            <span>${pair[1]}</span>
          </label>
        </div>
      </div>
    `;
  }).join('');

  // ========= 분류 로직 (직접 입력 요망) =========
  function getTypeScores(surveyAnswers) {
    const typeQuestions = {
      "A": [직접입력필요],
      "B": [직접입력필요],
      "C": [직접입력필요],
      "D": [직접입력필요]
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

  // ========= 제출 =========
  surveyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.style.display = 'none';
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = '제출 중...';

    try {
      await ensureFirebaseReady();

      // (A) 공통 강제 검증: required 붙은 모든 필드 확인 (서술형 포함)
      const requiredFields = surveyForm.querySelectorAll('input[required], textarea[required], select[required]');
      for (const field of requiredFields) {
        const val = (field.value || '').toString().trim();
        if (!val) {
          const qLabel = field.closest('.q')?.querySelector('.q-label')?.textContent?.trim();
          throw new Error((qLabel ? `${qLabel}을(를) ` : '') + '입력해주세요.');
        }
        if (field.reportValidity && !field.reportValidity()) {
          throw new Error('입력값을 다시 확인해주세요.');
        }
      }

      // (B) 선택형 40문항 수집(미선택시 명확히 문항 번호 안내)
      const selects = [];
      for (let i = 0; i < 40; i++) {
        const node = surveyForm[`select${i+1}`];      // RadioNodeList
        const sel  = node ? node.value : '';
        if (!sel) {
          throw new Error(`선택형 ${i+1}번을 선택해주세요.`);
        }
        selects.push(parseInt(sel, 10));
      }

      // (C) 서술형(구조화) 수집 (원본 로직 유지)
      let form = {};
      if (type === '신입') {
        form = {
          dream: surveyForm.n_dream.value.trim(),
          strengths: [
            surveyForm.n_strength1.value.trim(),
            surveyForm.n_strength2.value.trim(),
            surveyForm.n_strength3.value.trim(),
          ].filter(Boolean),
          achievements: [
            surveyForm.n_ach1.value.trim(),
            surveyForm.n_ach2.value.trim(),
            surveyForm.n_ach3.value.trim(),
          ],
          competency: {
            needed: surveyForm.n_comp_needed.value.trim(),
            score: Number(surveyForm.n_comp_score.value),
            effort: surveyForm.n_comp_effort.value.trim()
          },
          personalityStrength: surveyForm.n_personality_strength.value.trim(),
          expectations: [
            surveyForm.n_expect1.value.trim(),
            surveyForm.n_expect2.value.trim(),
            surveyForm.n_expect3.value.trim(),
            surveyForm.n_expect4.value.trim(),
            surveyForm.n_expect5.value.trim(),
            surveyForm.n_expect6.value.trim()
          ],
          otherOffers: surveyForm.n_otheroffers.value.trim(),
          salary: {
            min: Number(surveyForm.n_salary_min.value),
            max: Number(surveyForm.n_salary_max.value)
          }
        };
      } else {
        form = {
          successDef: surveyForm.e_success.value.trim(),
          pros: surveyForm.e_pros.value.trim(),
          cons: surveyForm.e_cons.value.trim(),
          strengths: [
            surveyForm.e_strength1.value.trim(),
            surveyForm.e_strength2.value.trim(),
            surveyForm.e_strength3.value.trim(),
          ],
          selfWords: surveyForm.e_words.value.trim(),
          bigAchievement: surveyForm.e_bigach.value.trim(),
          expectations: [
            surveyForm.e_expect1.value.trim(),
            surveyForm.e_expect2.value.trim(),
            surveyForm.e_expect3.value.trim(),
            surveyForm.e_expect4.value.trim(),
            surveyForm.e_expect5.value.trim(),
            surveyForm.e_expect6.value.trim()
          ],
          salary: {
            now: Number(surveyForm.e_salary_now.value),
            min: Number(surveyForm.e_salary_min.value),
            max: Number(surveyForm.e_salary_max.value)
          }
        };
      }

      // (D) 분류
      const result = classifyType(selects);

      // (E) 저장 데이터(기존 필드 유지 + form 추가)
      const docData = {
        type,
        name,
        birth,
        selects,
        resultType: result.label,
        typeScores: result.scores,
        form,                         // 새 구조화 필드
        date: new Date().toISOString()
      };

      // Firestore 저장
      await db.collection('responses').add(docData);

      // 완료 처리
      surveyForm.style.display = 'none';
      successBox.style.display = 'block';
    } catch (err) {
      console.error(err);
      errorEl.textContent = '제출 중 오류가 발생했습니다: ' + (err.message || err);
      errorEl.style.display = 'block';
      // 에러 위치로 스크롤(가능하면)
      const firstInvalid = surveyForm.querySelector(':invalid') || surveyForm.querySelector('input[required],textarea[required]');
      if (firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstInvalid.focus();
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '설문 제출';
    }
  });
})();


