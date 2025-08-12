// ===== Firebase 초기화 =====
(function () {
  if (!window.firebase) {
    console.error('Firebase SDK not loaded');
    return;
  }

  // ▶ 본인 프로젝트 값으로 교체되어 있으면 OK
  const firebaseConfig = {
    apiKey: "AIzaSyBTd07lQmaMleeNMo_3VXrxZtAdbw-AXlU",
    authDomain: "hrsurvey-dfd9a.firebaseapp.com",
    projectId: "hrsurvey-dfd9a",
    // storageBucket는 나중을 위해 올바른 기본값으로 맞춰 둡니다 (무료 플랜에서도 문제 없음)
    storageBucket: "hrsurvey-dfd9a.appspot.com",
    appId: "1:440188138119:web:c0b798ec7049380151fe22",
  };

  // 지금은 Storage 비활성 (나중에 true로만 바꾸면 PDF 업로드 활성화)
  window.USE_STORAGE = false;

  // 중복 초기화 방지
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  // 전역 핸들
  window.auth = firebase.auth();
  window.db = firebase.firestore();
  window.storage = firebase.storage();

  // 준비 대기 (익명 로그인 보장)
  window.ensureFirebaseReady = function ensureFirebaseReady(timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      let done = false;
      const timer = setTimeout(() => {
        if (!done) reject(new Error("Firebase 객체 준비 타임아웃"));
      }, timeoutMs);

      const unsub = auth.onAuthStateChanged(async (user) => {
        try {
          if (!user) {
            await auth.signInAnonymously();
          }
          done = true;
          clearTimeout(timer);
          unsub();
          resolve();
        } catch (e) {
          done = true;
          clearTimeout(timer);
          unsub();
          reject(e);
        }
      });
    });
  };
})();
