// js/firebase-init.js
// Firebase 초기화 + 페이지별로 선택적 인증(익명/이메일) 제어

(function () {
  // ======== 1) 본인 프로젝트 설정으로 교체 ========
  const firebaseConfig = {
    apiKey: "AIzaSyBTd07lQmaMleeNMo_3VXrxZtAdbw-AXlU",
    authDomain: "hrsurvey-dfd9a.firebaseapp.com",
    projectId: "hrsurvey-dfd9a",
    storageBucket: "hrsurvey-dfd9a.firebasestorage.app",
    appId: "1:440188138119:web:c0b798ec7049380151fe22",
  };
  // ==============================================

  const log = (...a) => console.log("[firebase-init]", ...a);
  const err = (...a) => console.error("[firebase-init]", ...a);

  // 앱 초기화 (중복 방지)
  try {
    if (!firebase.apps || firebase.apps.length === 0) {
      firebase.initializeApp(firebaseConfig);
      log("initializeApp OK");
    } else {
      log("use existing app");
    }
  } catch (e) {
    err("initializeApp error", e);
  }

  // 전역 캐시
  let readyOnce = null;

  /**
   * 페이지에서 호출: 인증 보장
   *  options = { anonymous: true|false }
   *    - anonymous=true  : 익명 허용(필요 시 자동 로그인)
   *    - anonymous=false : 익명 금지(관리자 페이지 등)
   */
  async function ensureAuth(options = { anonymous: true }) {
    // 최초 준비 Promise 생성(앱/서비스 준비)
    if (!readyOnce) {
      readyOnce = new Promise((resolve, reject) => {
        try {
          // 일단 서비스 핸들러를 만들어 둠
          window.db = firebase.firestore();
          window.storage = firebase.storage();
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    }
    await readyOnce;

    const auth = firebase.auth();

    // 현재 유저
    const current = auth.currentUser;

    if (current) {
      // 이미 로그인(익명/이메일) 상태면 그대로 사용
      return current;
    }

    // 아직 유저가 없으면… 옵션에 맞게
    if (options.anonymous) {
      // 설문 등: 익명 로그인 허용
      await auth.signInAnonymously();
      log("signed in anonymously");
      return auth.currentUser;
    } else {
      // 관리자 등: 익명 로그인 금지 → 유저가 없으면 그대로 반환(로그인 페이지가 처리)
      log("no user; anonymous disabled (waiting for email login)");
      return null;
    }
  }

  // 유틸: 이메일 로그인/로그아웃 (관리자 페이지에서 씀)
  async function emailSignIn(email, password) {
    // 혹시 익명 세션이 있으면 먼저 로그아웃
    if (firebase.auth().currentUser && firebase.auth().currentUser.isAnonymous) {
      await firebase.auth().signOut();
    }
    const cred = await firebase.auth().signInWithEmailAndPassword(email, password);
    return cred.user;
  }

  async function signOut() {
    await firebase.auth().signOut();
  }

  // 전역 export
  window.ensureAuth = ensureAuth;
  window.emailSignIn = emailSignIn;
  window.firebaseSignOut = signOut;
})();
