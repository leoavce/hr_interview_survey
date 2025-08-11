<!-- js/firebase-init.js -->
<script>
// ===== Firebase 초기화 =====
(function () {
  // ▶ 여기 본인 프로젝트 값으로 교체
  const firebaseConfig = {
    apiKey: "AIzaSyBTd07lQmaMleeNMo_3VXrxZtAdbw-AXlU",
    authDomain: "hrsurvey-dfd9a.firebaseapp.com",
    projectId: "hrsurvey-dfd9a",
    storageBucket: "hrsurvey-dfd9a.firebasestorage.app",
    appId: "1:440188138119:web:c0b798ec7049380151fe22",
  };

  // Storage 사용 토글 (지금은 false로 운영, 나중에 true로만 바꾸면 업로드/URL 저장 활성화)
  window.USE_STORAGE = false;

  // 중복 초기화 방지
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  // 전역 핸들
  window.auth = firebase.auth();
  window.db = firebase.firestore();
  // Storage SDK는 로딩만 하고, USE_STORAGE=false면 실제 업로드는 건너뜀
  window.storage = firebase.storage();

  // 준비 대기 (Auth 익명 로그인 보장)
  window.ensureFirebaseReady = function ensureFirebaseReady(timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      let done = false;
      const timer = setTimeout(() => {
        if (!done) reject(new Error("Firebase 객체 준비 타임아웃"));
      }, timeoutMs);

      // 이미 로그인되어 있으면 바로 resolve
      const unsub = auth.onAuthStateChanged(async (user) => {
        try {
          if (!user) {
            // 설문 페이지 등 익명 로그인 필요
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
</script>
