import React, { useRef, useEffect } from 'react';
import { checkGaze } from '../utils/gazeMath';

// Ultra-simple FaceMesh loader
const getFaceMesh = async () => {
    if ((window as any).FaceMesh) return (window as any).FaceMesh;
    try {
        const mp = await import('@mediapipe/face_mesh');
        return mp.FaceMesh || (mp as any).default?.FaceMesh || (window as any).FaceMesh;
    } catch {
        return (window as any).FaceMesh;
    }
};

interface CameraViewProps {
    onGazeUpdate: (looking: boolean) => void;
    isEnabled: boolean;
    onError?: (error: string) => void;
    onStatusChange?: (status: string) => void;
}

export const CameraView: React.FC<CameraViewProps> = ({ onGazeUpdate, isEnabled, onError, onStatusChange }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const faceMeshRef = useRef<any>(null);
    const animationRef = useRef<number>(0);
    const gazeUpdateRef = useRef(onGazeUpdate);

    // Always keep the ref current to avoid stale closures in listeners
    useEffect(() => {
        gazeUpdateRef.current = onGazeUpdate;
    }, [onGazeUpdate]);

    // 1. Manage the Camera Stream
    useEffect(() => {
        if (!isEnabled) {
            // STOP camera
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
                streamRef.current = null;
            }
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
            onStatusChange?.("Camera OFF");
            cancelAnimationFrame(animationRef.current);
            return;
        }

        // START camera
        let active = true;
        onStatusChange?.("Requesting Camera...");

        navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } })
            .then(stream => {
                if (!active) {
                    stream.getTracks().forEach(t => t.stop());
                    return;
                }
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().catch(e => {
                        console.warn("Play interrupted", e);
                    });
                }
                onStatusChange?.("Camera ON");
                startTracking();
            })
            .catch(err => {
                console.error("Camera fail:", err);
                onError?.("Camera Access Denied or Missing");
                onStatusChange?.("Camera Error");
            });

        return () => {
            active = false;
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
                streamRef.current = null;
            }
            cancelAnimationFrame(animationRef.current);
        };
    }, [isEnabled]); // Only depend on isEnabled

    // 2. Manage the Tracking
    const startTracking = async () => {
        if (!faceMeshRef.current) {
            onStatusChange?.("Loading AI...");
            const FM = await getFaceMesh();
            if (!FM) {
                onError?.("Failed to load FaceMesh");
                return;
            }

            faceMeshRef.current = new FM({
                locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`
            });
            faceMeshRef.current.setOptions({
                maxNumFaces: 1,
                refineLandmarks: true,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });
            faceMeshRef.current.onResults((res: any) => {
                if (res.multiFaceLandmarks && res.multiFaceLandmarks.length > 0) {
                    const gaze = checkGaze(res.multiFaceLandmarks[0]);
                    gazeUpdateRef.current(gaze.isLookingAtScreen);
                }
            });
            onStatusChange?.("Tracking Active");
        }

        // Tracking loop
        const loop = async () => {
            if (videoRef.current && videoRef.current.readyState >= 2 && faceMeshRef.current && isEnabled) {
                try {
                    await faceMeshRef.current.send({ image: videoRef.current });
                } catch (e) {
                    // ignore send errors
                }
            }
            animationRef.current = requestAnimationFrame(loop);
        };
        loop();
    };

    return (
        <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transition-opacity duration-1000 ${isEnabled ? 'opacity-100' : 'opacity-0'}`}
            />
            {!isEnabled && (
                <div className="absolute inset-0 flex items-center justify-center text-zinc-600 font-bold uppercase tracking-widest text-sm">
                    Camera OFF
                </div>
            )}
        </div>
    );
};
