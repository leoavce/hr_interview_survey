(function () {
  const firebaseConfig = {
    apiKey: "AIzaSyBTd07lQmaMleeNMo_3VXrxZtAdbw-AXlU",
    authDomain: "hrsurvey-dfd9a.firebaseapp.com",
    projectId: "hrsurvey-dfd9a",
    storageBucket: "hrsurvey-dfd9a.firebasestorage.app",
    appId: "1:440188138119:web:c0b798ec7049380151fe22",
  };

  window.USE_STORAGE = false;

  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

  window.auth = firebase.auth();
  window.db = firebase.firestore();
  window.storage = firebase.storage();

  // ✅ allowAnonymous 옵션 추가 (기본 true)
  window.ensureFirebaseReady = function ensureFirebaseReady(opts = {}) {
    const { allowAnonymous = true, timeoutMs = 10000 } = opts;

    return new Promise((resolve, reject) => {
      let done = false;
      const timer = setTimeout(() => !done && reject(new Error("Firebase 객체 준비 타임아웃")), timeoutMs);

      const unsub = auth.onAuthStateChanged(async (user) => {
        try {
          if (!user && allowAnonymous) {
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
