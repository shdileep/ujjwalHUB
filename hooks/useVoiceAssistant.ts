import { useRef, useEffect, useState, useCallback } from 'react';

export const useVoiceAssistant = () => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    // UseRef to keep track if we can speak (e.g. user enabled it)
    const enabledRef = useRef(true);

    const speak = useCallback((text: string) => {
        if (!enabledRef.current || typeof window === 'undefined') return;

        // Cancel previous
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.rate = 1.1; // Slightly faster for efficiency
        utterance.pitch = 1.0;

        // Try to find a "Google English" voice if available for better quality
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.name.includes("Google") && v.lang.includes("en")) || voices[0];
        if (preferredVoice) utterance.voice = preferredVoice;

        window.speechSynthesis.speak(utterance);
    }, []);

    const stop = useCallback(() => {
        if (typeof window !== 'undefined') {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    }, []);

    // Cleanup
    useEffect(() => {
        return () => {
            if (typeof window !== 'undefined') {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    return { speak, stop, isSpeaking };
};
