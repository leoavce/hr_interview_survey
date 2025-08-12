// js/firebase-init.js  (※ <script> 태그 넣지 마세요)
// Firebase 초기화
(function () {
  const firebaseConfig = {
    apiKey: "AIzaSyBTd07lQmaMleeNMo_3VXrxZtAdbw-AXlU",
    authDomain: "hrsurvey-dfd9a.firebaseapp.com",
    projectId: "hrsurvey-dfd9a",
    storageBucket: "hrsurvey-dfd9a.firebasestorage.app",
    appId: "1:440188138119:web:c0b798ec7049380151fe22",
  };

  // PDF 업로드는 당분간 OFF (나중에 true로)
  window.USE_STORAGE = false;

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  window.auth = firebase.auth();
  window.db = firebase.firestore();
  window.storage = firebase.storage();

  // 익명 로그인까지 보장
  window.ensureFirebaseReady = function (timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      let done = false;
      const timer = setTimeout(() => {
        if (!done) reject(new Error("Firebase 객체 준비 타임아웃"));
      }, timeoutMs);

      const unsub = auth.onAuthStateChanged(async (user) => {
        try {
          if (!user) await auth.signInAnonymously();
          done = true; clearTimeout(timer); unsub(); resolve();
        } catch (e) {
          done = true; clearTimeout(timer); unsub(); reject(e);
        }
      });
    });
  };
})();
