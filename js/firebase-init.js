// Firebase 초기화 (여기에 본인 firebaseConfig 입력)
const firebaseConfig = {
  apiKey: "AIzaSyBTd07lQmaMleeNMo_3VXrxZtAdbw-AXlU",
  authDomain: "hrsurvey-dfd9a.firebaseapp.com",
  projectId: "hrsurvey-dfd9a",
  storageBucket: "hrsurvey-dfd9a.firebasestorage.app",
  messagingSenderId: "440188138119",
  appId: "1:440188138119:web:c0b798ec7049380151fe22"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
