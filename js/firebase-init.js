// js/firebase-init.js
// Firebase 프로젝트 설정값을 사용하세요.
const firebaseConfig = {
  apiKey: "AIzaSyBTd07lQmaMleeNMo_3VXrxZtAdbw-AXlU",
  authDomain: "hrsurvey-dfd9a.firebaseapp.com",
  projectId: "hrsurvey-dfd9a",
  storageBucket: "hrsurvey-dfd9a.appspot.com",
  messagingSenderId: "440188138119",
  appId: "1:440188138119:web:c0b798ec7049380151fe22"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

window.db = firebase.firestore();
window.auth = firebase.auth();
window.storage = firebase.storage();

// 편의 함수: 오늘 YYYY-MM-DD
window.todayISO = () => new Date().toISOString().slice(0, 10);
