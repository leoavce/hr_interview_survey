<!-- 파일: js/firebase-init.js -->
<script>
// ✅ Firebase 초기화 + 전역 객체 준비 + 익명 로그인 완료 보장

(function () {
  // 1) 프로젝트 키 입력
  const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT",
    storageBucket: "YOUR_PROJECT.appspot.com",
    appId: "YOUR_APP_ID",
  };

  // 2) 앱 초기화 (중복 방지)
  if (firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
  }

  // 3) 전역 핸들
  const auth = firebase.auth();
  const db = firebase.firestore();
  const storage = firebase.storage();

  // 4) 익명 로그인 완료를 ‘반드시’ 보장하는 Promise
  const appReady = new Promise((resolve, reject) => {
    let resolved = false;

    auth.onAuthStateChanged(async (user) => {
      try {
        if (!user) {
          // 아직 로그인 안 됨 → 익명 로그인
          await auth.signInAnonymously();
        }
        // 로그인 완료
        if (!resolved) {
          resolved = true;
          resolve();
        }
      } catch (err) {
        console.error("[init] signInAnonymously 실패:", err);
        if (!resolved) {
          resolved = true;
          reject(err);
        }
      }
    });
  });

  // 5) 전역 노출
  window.firebaseApp = firebase.app();
  window.auth = auth;
  window.db = db;
  window.storage = storage;
  window.appReady = appReady;
})();
</script>
