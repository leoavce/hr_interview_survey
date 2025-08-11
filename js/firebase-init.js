// assets/js/firebase-init.js

// Firebase v8 전역 초기화 파일
// - v8 CDN을 survey.html, admin.html에서 로드한 뒤 이 파일을 로드해야 합니다.
// - 이 파일은 전역으로 firebaseApp, db를 노출합니다.

(function () {
  // 수정됨: storageBucket 도메인은 *.appspot.com 사용 권장
  const firebaseConfig = {
    apiKey: "AIzaSyBTd07lQmaMleeNMo_3VXrxZtAdbw-AXlU",
    authDomain: "hrsurvey-dfd9a.firebaseapp.com",
    projectId: "hrsurvey-dfd9a",
    storageBucket: "hrsurvey-dfd9a.appspot.com", // 수정됨
    messagingSenderId: "440188138119",
    appId: "1:440188138119:web:c0b798ec7049380151fe22",
  };

  // 이미 초기화됐다면 재초기화 방지
  if (!firebase.apps.length) {
    window.firebaseApp = firebase.initializeApp(firebaseConfig);
  } else {
    window.firebaseApp = firebase.app();
  }

  // 전역 Firestore 핸들
  window.db = firebase.firestore();

  // 서버 타임스탬프 헬퍼
  window.serverTS = firebase.firestore.FieldValue.serverTimestamp;

  // 유틸: 오늘 날짜를 KST 기준 YYYY-MM-DD로
  window.todayKSTString = function () {
    // 'sv-SE'는 2025-08-11 형식
    return new Date()
      .toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" })
      .slice(0, 10);
  };
})();
