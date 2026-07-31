import { auth } from "./firebase.js";

import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

export async function login(email, password) {
    const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
    );

    return userCredential.user;
}

export async function register(email, password) {
    const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
    );

    return userCredential.user;
}

export async function logout() {
    await signOut(auth);
}

export function watchUser(callback) {
    onAuthStateChanged(auth, callback);
}
