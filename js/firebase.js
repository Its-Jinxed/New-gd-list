import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const firebaseConfig = {

  apiKey: "AIzaSyBvG9itr56f2lOk5Jp9M_hW32BVn25RoK4",

  authDomain: "gdlist-8981c.firebaseapp.com",

  projectId: "gdlist-8981c",

  storageBucket: "gdlist-8981c.firebasestorage.app",

  messagingSenderId: "786629130235",

  appId: "1:786629130235:web:d267940861919d2e5b3d5e"

};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
