// js/firebase-init.js
(function () {
  const firebaseConfig = {
    apiKey: "AIzaSyBTd07lQmaMleeNMo_3VXrxZtAdbw-AXlU",
    authDomain: "hrsurvey-dfd9a.firebaseapp.com",
    projectId: "hrsurvey-dfd9a",
    storageBucket: "hrsurvey-dfd9a.appspot.com",
    messagingSenderId: "440188138119",
    appId: "1:440188138119:web:c0b798ec7049380151fe22"
  };

  if (!window.firebase) {
    console.error("[init] Firebase SDK가 로드되지 않았습니다.");
    return;
  }

  if (firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
    console.log("[init] firebase.initializeApp 완료");
  } else {
    console.log("[init] 이미 초기화됨");
  }

  // 전역 바인딩(Compat)
  window.auth = firebase.auth();
  window.db = firebase.firestore();
  window.storage = firebase.storage();

  // 익명 로그인 시도
  window.__AUTH_READY__ = new Promise((resolve) => {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        console.log("[init] onAuthStateChanged: 로그인됨 uid =", user.uid);
        resolve(user);
      } else {
        console.log("[init] 로그인 안됨 → 익명 로그인 시도");
        try {
          const cred = await auth.signInAnonymously();
          console.log("[init] 익명 로그인 성공 uid =", cred.user?.uid);
          resolve(cred.user);
        } catch (e) {
          console.error("[init] 익명 로그인 실패:", e);
          resolve(null); // 그래도 진행은 하되, 쓰기 시 Permission 오류가 나게 됨
        }
      }
    });
  });

  console.log("[init] Firebase 초기화 완료");
})();
