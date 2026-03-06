import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    confirmPasswordReset,
    verifyPasswordResetCode,
    sendEmailVerification,
    applyActionCode,
    User
} from "firebase/auth";
import { auth } from "./firebase";

export const signIn = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
};

export const signUp = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (userCredential.user) {
        await sendEmailVerification(userCredential.user);
    }
    return userCredential;
};

export const sendVerificationEmail = async () => {
    if (auth.currentUser) {
        return sendEmailVerification(auth.currentUser);
    }
    throw new Error("No user is currently signed in.");
};

export const verifyEmail = (code: string) => {
    return applyActionCode(auth, code);
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
