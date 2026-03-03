import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User as FirebaseUser,
    sendPasswordResetEmail,
    setPersistence,
    browserLocalPersistence
} from 'firebase/auth';
import { auth } from '../firebase.config';
import { User } from '../types';

// Set persistence to local (survives browser restart/refresh)
setPersistence(auth, browserLocalPersistence);

export const authService = {
    // Sign up with email and password
    async signUp(email: string, password: string): Promise<FirebaseUser> {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    },

    // Sign in with email and password
    async signIn(email: string, password: string): Promise<FirebaseUser> {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    },

    // Sign out
    async signOut(): Promise<void> {
        await signOut(auth);
    },

    // Send password reset email
    async resetPassword(email: string): Promise<void> {
        await sendPasswordResetEmail(auth, email);
    },

    // Subscribe to auth state changes
    onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
        return onAuthStateChanged(auth, callback);
    },

    // Get current user
    getCurrentUser(): FirebaseUser | null {
        return auth.currentUser;
    },

    // Delete current user
    async deleteAccount(): Promise<void> {
        const user = auth.currentUser;
        if (user) {
            await user.delete();
        }
    }
};
