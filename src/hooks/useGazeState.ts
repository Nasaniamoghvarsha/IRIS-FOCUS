import { useState, useRef, useCallback } from 'react';
import { audioController } from '../utils/AudioController';

export const useGazeState = (thresholdSeconds: number) => {
    const [isLookingAtScreen, setIsLookingAtScreen] = useState(true);
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);
    const isMusicPlayingRef = useRef(false);
    const awayTimer = useRef<number | null>(null);

    const updateGaze = useCallback((looking: boolean) => {
        setIsLookingAtScreen(looking);

        if (looking) {
            // User is looking back
            if (awayTimer.current) {
                clearTimeout(awayTimer.current);
                awayTimer.current = null;
            }
            if (isMusicPlayingRef.current) {
                console.log("Looking back: Pausing music");
                audioController.pauseWithFade();
                setIsMusicPlaying(false);
                isMusicPlayingRef.current = false;
            }
        } else {
            // User is looking away
            if (!awayTimer.current && !isMusicPlayingRef.current) {
                console.log("Looking away: Starting away timer");
                awayTimer.current = window.setTimeout(() => {
                    console.log("Threshold reached: Playing music");
                    audioController.playWithFade();
                    setIsMusicPlaying(true);
                    isMusicPlayingRef.current = true;
                    awayTimer.current = null;
                }, thresholdSeconds * 1000);
            }
        }
    }, [thresholdSeconds]);

    const stopMusic = useCallback(() => {
        if (awayTimer.current) {
            clearTimeout(awayTimer.current);
            awayTimer.current = null;
        }
        if (isMusicPlayingRef.current) {
            audioController.pauseWithFade();
            setIsMusicPlaying(false);
            isMusicPlayingRef.current = false;
        }
    }, []);

    return {
        isLookingAtScreen,
        isMusicPlaying,
        updateGaze,
        stopMusic
    };
};
