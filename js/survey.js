// js/survey.js (포트폴리오 일반화 버전)
(function () {
  const surveyForm   = document.getElementById('surveyForm');
  const titleEl      = document.getElementById('surveyTitle');
  const infoEl       = document.getElementById('candidateInfo');
  const errorEl      = document.getElementById('errorMessage');
  const successBox   = document.getElementById('successBox');

  const essaySection  = document.getElementById('essaySection');
  const choiceSection = document.getElementById('choiceSection');

  // 세션에서 지원자 정보 (포트폴리오 전용 키; 기존 키와 동일 사용)
  const type  = sessionStorage.getItem('applyType')  || '경력'; // "신입" / "경력"
  const name  = sessionStorage.getItem('applyName')  || '';
  const birth = sessionStorage.getItem('applyBirth') || '';

  // 상단 제목/지원자 정보 (일반화)
  if (titleEl) {
    titleEl.textContent = (type === '신입')
      ? '사전 설문(포트폴리오) — 신입'
      : '사전 설문(포트폴리오) — 경력';
  }
  if (infoEl) {
    infoEl.innerHTML = `
      <span class="badge">${type}</span>
      <span class="muted">이름: ${escapeHtml(name || '미기입')}</span>
      <span class="muted">생년월일: ${escapeHtml(birth || '미기입')}</span>
    `;
  }

  // ===== 선택형 문항 페어 (디자인/개수 동일, 내용만 일반화) =====
  // 기존 choicePairs 배열이 전역에 있다면 덮어씌우지 말고, 여기서 정의/사용하세요.
  const choicePairs = (window.choicePairs && Array.isArray(window.choicePairs))
    ? window.choicePairs
    : [
        ['새로운 도전을 선호한다', '정해진 절차를 선호한다'],
        ['개인 성과에 동기부여된다', '팀 성과에 동기부여된다'],
        ['빠른 실행이 중요하다', '완벽한 준비가 중요하다'],
        ['수치 기반 의사결정을 선호한다', '정성적 판단을 선호한다'],
        ['리스크를 감수한다', '리스크를 회피한다'],
        ['즉각적인 피드백을 선호한다', '주기적/정기 피드백을 선호한다'],
        ['주도적으로 일한다', '조율하며 일한다'],
        ['디테일에 강하다', '큰 그림에 강하다'],
        ['독립적 업무를 선호한다', '협업을 선호한다'],
        ['규모 확장에 관심이 많다', '안정적 운영에 관심이 많다'],
        // 10쌍 * 4 = 40문항 유지
        ['표준화를 중시한다', '유연성을 중시한다'],
        ['데이터 분석을 즐긴다', '사람과의 인터랙션을 즐긴다'],
        ['결과를 우선시한다', '과정을 우선시한다'],
        ['의사결정 속도가 빠르다', '충분한 합의를 거친다'],
        ['실험을 즐긴다', '재현 가능성을 중시한다'],
        ['새 도구 시도를 즐긴다', '검증된 도구를 선호한다'],
        ['정량 목표를 선호한다', '정성 목표를 선호한다'],
        ['과감한 목표 설정', '현실적 목표 설정'],
        ['개인 학습에 투자', '조직 학습에 투자'],
        ['성과지표 고도화', '프로세스 개선'],
        ['고객 가치 우선', '내부 효율 우선'],
        ['문서화 철저', '구두 커뮤니케이션 원활'],
        ['리더십 발휘', '팔로워십 발휘'],
        ['멀티태스킹 선호', '싱글태스킹 선호'],
        ['전체 일정 관리', '세부 일정 관리'],
        ['의견을 먼저 제시', '경청을 먼저 수행'],
        ['명확한 규칙 선호', '자율과 책임 선호'],
        ['직접 해결 선호', '위임/조정 선호'],
        ['고객지향 강함', '제품지향 강함'],
        ['문제 원인 탐색', '해결책 디자인'],
        ['주요 지표 추적', '가설 검증 반복'],
        ['커뮤니티 활동 활발', '깊이 있는 연구 선호'],
        ['크로스펑셔널 선호', '전문화된 영역 선호'],
        ['신속한 MVP', '탄탄한 V1'],
        ['속도 우선', '품질 우선'],
        ['아이디어 다작', '선별과 집중'],
        ['표준 프로세스 준수', '케이스별 최적화'],
        ['성장/커리어', '보상/안정'],
        ['영향력/임팩트', '워크라이프 밸런스'],
        ['내부고객 만족', '외부고객 만족']
      ];

  function renderEssaysForNew() {
    essaySection.innerHTML = `
      <div class="q">
        <label class="q-label">1. 미래 포부(희망하는 역할/목표)를 말씀해 주세요.</label>
        <textarea name="n_dream" required placeholder="3~5년 내 이루고 싶은 목표와 그 이유를 구체적으로 적어주세요."></textarea>
      </div>

      <div class="q">
        <label class="q-label">2. 본인의 강점/개성을 소개해 주세요.</label>
        <div class="grid-1">
          <textarea name="n_strength1" required placeholder="핵심 강점 1"></textarea>
          <textarea name="n_strength2" placeholder="(선택) 강점 2"></textarea>
          <textarea name="n_strength3" placeholder="(선택) 강점 3"></textarea>
        </div>
      </div>

      <div class="q">
        <label class="q-label">3. 자신 있게 보여줄 수 있는 경험/성과 3가지를 적어 주세요.</label>
        <div class="grid-1">
          <textarea name="n_ach1" required placeholder="경험/성과 1 (상황-행동-결과)"></textarea>
          <textarea name="n_ach2" required placeholder="경험/성과 2 (상황-행동-결과)"></textarea>
          <textarea name="n_ach3" required placeholder="경험/성과 3 (상황-행동-결과)"></textarea>
        </div>
      </div>

      <div class="q">
        <label class="q-label">4. 지원 직무에서 성과를 내기 위해 필요한 역량은 무엇인가요?</label>
        <textarea name="n_comp_needed" required placeholder="핵심 역량을 구체적으로 기술 (예: 문제해결, 커뮤니케이션, 데이터 해석 등)"></textarea>

        <div style="margin-top:10px;">
          <label class="q-label">현재 본인의 해당 역량 보유 수준 (10점 만점)</label>
          <input type="number" min="0" max="10" step="1" name="n_comp_score" required placeholder="0~10" style="width:120px;">
        </div>

        <div style="margin-top:10px;">
          <label class="q-label">해당 역량을 키우기 위해 어떤 노력을 했나요? (키워드 중심)</label>
          <textarea name="n_comp_effort" required placeholder="예: 온라인 강의 수강, 프로젝트 참여, 멘토링, 독서 등"></textarea>
        </div>
      </div>

      <div class="q">
        <label class="q-label">5. 주변에서 자주 듣는 성격(성향)상의 장점과 그 이유는 무엇인가요?</label>
        <textarea name="n_personality_strength" required placeholder="구체적인 사례와 함께 적어주세요."></textarea>
      </div>

      <div class="q">
        <label class="q-label">6. 일을 통해 기대하는 가치를 중요한 순서대로 적어 주세요.</label>
        <div class="info">예시) 성장, 보상, 안정, 영향력, 문화/동료, 워라밸</div>
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
        <label class="q-label">7. 현재 진행 중인 다른 지원 현황이 있나요?</label>
        <textarea name="n_otheroffers" required placeholder="예: X사 최종합격, Y사 2차면접 진행 중 (없으면 '없음')"></textarea>
      </div>

      <div class="q">
        <label class="q-label">8. 희망 연봉 범위를 기입해 주세요.</label>
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
        <label class="q-label">1. 귀하가 정의하는 ‘일에서의 성공’은 무엇인가요?</label>
        <textarea name="e_success" required placeholder="본인의 성공 정의와 그 배경을 적어주세요."></textarea>
      </div>

      <div class="q">
        <label class="q-label">2. 본인의 성격적 장점/단점을 간단히 기술해 주세요.</label>
        <textarea name="e_pros" required placeholder="#장점 - 강점과 발휘 사례"></textarea>
        <textarea name="e_cons" required placeholder="#단점 - 보완점과 개선 노력" style="margin-top:8px;"></textarea>
      </div>

      <div class="q">
        <label class="q-label">3. 타인과 구별되는 강점을 3가지 적어 주세요.</label>
        <div class="grid-1">
          <textarea name="e_strength1" required placeholder="강점 1 (근거 포함)"></textarea>
          <textarea name="e_strength2" required placeholder="강점 2 (근거 포함)"></textarea>
          <textarea name="e_strength3" required placeholder="강점 3 (근거 포함)"></textarea>
        </div>
      </div>

      <div class="q">
        <label class="q-label">4. 나를 표현하는 단어 3가지</label>
        <textarea name="e_words" required placeholder="예: 데이터드리븐, 책임감, 협업지향"></textarea>
      </div>

      <div class="q">
        <label class="q-label">5. 가장 큰 성취 경험과 맡았던 역할을 기술해 주세요.</label>
        <textarea name="e_bigach" required placeholder="상황(S)-과제(T)-행동(A)-결과(R) 구조로 작성"></textarea>
      </div>

      <div class="q">
        <label class="q-label">6. 일에서 가장 중요하게 여기는 가치를 순서대로 적어 주세요.</label>
        <div class="info">예시) 성장, 보상, 안정, 영향력, 문화/동료, 워라밸</div>
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
        <label class="q-label">7. 연봉 정보를 기입해 주세요.</label>
        <div class="grid-1">
          <div>
            <span>현재 연봉(기본급)</span>
            <div style="margin-top:6px;">
              <input type="number" name="e_salary_now" required placeholder="0" class="salary-input"> (만원)
            </div>
          </div>
          <div style="margin-top:8px;">
            <span>희망 연봉</span>
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

  // ========= 분류 로직 (직접 입력 요망: 포트폴리오용 더미 맵) =========
  function getTypeScores(surveyAnswers) {
    const typeQuestions = {
      "A": [/* 직접입력필요: 예) 1,5,9,... */],
      "B": [/* 직접입력필요 */],
      "C": [/* 직접입력필요 */],
      "D": [/* 직접입력필요 */]
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

      // (A) 공통 강제 검증
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

      // (B) 선택형 40문항 수집
      const selects = [];
      for (let i = 0; i < 40; i++) {
        const node = surveyForm[`select${i+1}`];      // RadioNodeList
        const sel  = node ? node.value : '';
        if (!sel) {
          throw new Error(`선택형 ${i+1}번을 선택해주세요.`);
        }
        selects.push(parseInt(sel, 10));
      }

      // (C) 서술형(구조화) 수집
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

      // (E) 저장 데이터
      const docData = {
        type,
        name,
        birth,
        selects,
        resultType: result.label,
        typeScores: result.scores,
        form,
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

  function escapeHtml(s){
    return String(s||'').replace(/[&<>"']/g,(m)=>({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[m]));
  }
})();
