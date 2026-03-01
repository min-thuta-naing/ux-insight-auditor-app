import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    confirmPasswordReset,
    verifyPasswordResetCode,
    User
} from "firebase/auth";
import { auth } from "./firebase";

export const signIn = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
};

export const signUp = (email: string, password: string) => {
    return createUserWithEmailAndPassword(auth, email, password);
};

export const resetPassword = (email: string) => {
    return sendPasswordResetEmail(auth, email);
};

export const verifyResetCode = (code: string) => {
    return verifyPasswordResetCode(auth, code);
};

export const confirmReset = (code: string, newPassword: string) => {
    return confirmPasswordReset(auth, code, newPassword);
};

export const logout = () => {
    return firebaseSignOut(auth);
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
};
