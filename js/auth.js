import { auth } from "./firebase.js";

import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

/**
 * Sign in with email and password.
 */
export async function login(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        return userCredential.user;
    } catch (error) {
        console.error("Login failed:", error);
        throw error;
    }
}

/**
 * Create a new account.
 */
export async function register(email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );

        return userCredential.user;
    } catch (error) {
        console.error("Registration failed:", error);
        throw error;
    }
}

/**
 * Sign out.
 */
export async function logout() {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout failed:", error);
        throw error;
    }
}

/**
 * Listen for authentication changes.
 */
export function watchUser(callback) {
    return onAuthStateChanged(auth, callback);
}

/**
 * Get the currently signed-in user.
 */
export function getCurrentUser() {
    return auth.currentUser;
}
