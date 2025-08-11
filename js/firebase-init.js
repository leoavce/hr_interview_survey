// Firebase 초기화 (네가 제공한 구성값 그대로 사용)
const firebaseConfig = {
  apiKey: "AIzaSyBTd07lQmaMleeNMo_3VXrxZtAdbw-AXlU",
  authDomain: "hrsurvey-dfd9a.firebaseapp.com",
  projectId: "hrsurvey-dfd9a",
  storageBucket: "hrsurvey-dfd9a.firebasestorage.app",
  messagingSenderId: "440188138119",
  appId: "1:440188138119:web:c0b798ec7049380151fe22"
};

// v10 compat SDK 사용
firebase.initializeApp(firebaseConfig);

// Firestore / Storage 전역 준비
const db = firebase.firestore();
const storage = firebase.storage();
const auth = firebase.auth();

// 최소 권한 세션 확보: 익명 로그인
// (이게 있어야 Firestore/Storage 보안규칙에서 authenticated 조건을 만족할 수 있어요)
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    try {
      await auth.signInAnonymously();
      console.log("✅ Firebase: 익명 로그인 완료");
    } catch (err) {
      console.error("❌ Firebase 익명 로그인 실패:", err);
    }
  } else {
    // 이미 로그인 상태
    // console.log("✅ Firebase: 사용자 로그인 상태", user.uid);
  }
});
