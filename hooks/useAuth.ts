import { useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { authService } from '../services/auth.service';

export const useAuth = () => {
    const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = authService.onAuthStateChanged((user) => {
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    return {
        currentUser,
        loading,
        signUp: authService.signUp,
        signIn: authService.signIn,
        signOut: authService.signOut,
        resetPassword: authService.resetPassword
    };
};
