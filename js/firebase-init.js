// js/firebase-init.js
// Firebase 초기화 (Compat SDK)
(function () {
  // 본인 프로젝트 설정으로 맞춤
  const firebaseConfig = {
    apiKey: "AIzaSyBTd07lQmaMleeNMo_3VXrxZtAdbw-AXlU",
    authDomain: "hrsurvey-dfd9a.firebaseapp.com",
    projectId: "hrsurvey-dfd9a",
    // ✅ Storage 버킷은 appspot.com 도메인이 정식입니다.
    storageBucket: "hrsurvey-dfd9a.appspot.com",
    messagingSenderId: "440188138119",
    appId: "1:440188138119:web:c0b798ec7049380151fe22"
  };

  // SDK 로드 확인
  if (!window.firebase || !firebase.apps) {
    console.error("Firebase SDK가 로드되지 않았습니다.");
    return;
  }

  // 중복 초기화 방지
  if (firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
  }

  // 전역 참조 (Compat)
  window.auth = firebase.auth();
  window.db = firebase.firestore();
  window.storage = firebase.storage();

  // Firestore 타임스탬프 등 기본 설정(옵션)
  // db.settings({ ignoreUndefinedProperties: true });

  // ✅ 설문/공개 페이지에서 쓰기 가능하도록 익명 로그인 유지
  // Firebase 콘솔 > Authentication > Sign-in method에서 Anonymous 활성화 필요
  auth.onAuthStateChanged((user) => {
    if (!user) {
      auth.signInAnonymously().catch((err) => {
        console.error("익명 로그인 실패:", err);
      });
    }
  });

  console.log("Firebase 초기화 완료");
})();
