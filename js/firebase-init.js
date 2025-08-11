// js/firebase-init.js
// Firebase 초기화 + 익명 로그인 + Firestore/Storage 준비 완료 Promise

(function () {
  // TODO: 본인 프로젝트 값으로 교체
  const firebaseConfig = {
    apiKey: "AIzaSyBTd07lQmaMleeNMo_3VXrxZtAdbw-AXlU",
    authDomain: "hrsurvey-dfd9a.firebaseapp.com",
    projectId: "hrsurvey-dfd9a",
    storageBucket: "hrsurvey-dfd9a.firebasestorage.app",
    appId: "1:440188138119:web:c0b798ec7049380151fe22",
  };

  // 콘솔 로깅 헬퍼
  const log = (...args) => console.log("[firebase-init]", ...args);
  const warn = (...args) => console.warn("[firebase-init]", ...args);
  const err = (...args) => console.error("[firebase-init]", ...args);

  // 중복 초기화 방지
  try {
    if (!firebase.apps || firebase.apps.length === 0) {
      firebase.initializeApp(firebaseConfig);
      log("initializeApp 완료");
    } else {
      log("이미 초기화된 앱 사용");
    }
  } catch (e) {
    err("initializeApp 오류", e);
  }

  // 전역 Promise: Firebase 준비 완료 시 resolve
  const readyPromise = new Promise((resolve, reject) => {
    const timeoutMs = 15000; // 15초
    const timer = setTimeout(() => {
      err("Firebase 준비 타임아웃");
      reject(new Error("Firebase 준비 타임아웃"));
    }, timeoutMs);

    // 인증 상태 감시
    firebase.auth().onAuthStateChanged(async (user) => {
      try {
        if (!user) {
          log("사용자 없음 → 익명 로그인 시도");
          await firebase.auth().signInAnonymously();
          log("익명 로그인 성공");
          return; // onAuthStateChanged가 다시 호출됨
        }

        // Firestore/Storage 객체 생성
        window.db = firebase.firestore();
        window.storage = firebase.storage();
        window.firebaseReady = true;

        clearTimeout(timer);
        document.dispatchEvent(new Event("firebase-ready"));
        log("Firestore/Storage 준비 완료");
        resolve();
      } catch (e) {
        clearTimeout(timer);
        err("인증/준비 중 오류", e);
        reject(e);
      }
    });
  });

  // 전역으로 노출
  window.firebaseReadyPromise = readyPromise;
})();
