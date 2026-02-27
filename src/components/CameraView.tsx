/**
 * CameraView Component
 * 
 * Logic flow:
 * 1. Request Webcam access via getUserMedia.
 * 2. Dynamically load MediaPipe FaceMesh via CDN Fallback/Dynamic Import.
 * 3. Initialize FaceMesh with iris landmarks enabled.
 * 4. Run the high-frequency tracking loop using requestAnimationFrame.
 */

import React, { useRef, useEffect } from 'react';
import { checkGaze } from '../utils/gazeMath';

// Purely dynamic/global access to avoid Vite SyntaxErrors with MediaPipe
const getFaceMesh = async () => {
    // 1. Check if already on window (from script tag)
    if ((window as any).FaceMesh) return (window as any).FaceMesh;

    // 2. Try dynamic import
    try {
        const mp = await import('@mediapipe/face_mesh');
        return mp.FaceMesh || (mp as any).default?.FaceMesh || (window as any).FaceMesh;
    } catch (e) {
        console.warn("Dynamic import of MediaPipe failed, checking window...", e);
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
    const faceMeshRef = useRef<any>(null);
    const requestRef = useRef<number | null>(null);

    useEffect(() => {
        let isCancelled = false;

        const initCamera = async () => {
            if (!videoRef.current) return;
            try {
                onStatusChange?.("Requesting camera...");
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "user", width: 640, height: 480 },
                    audio: false,
                });

                if (isCancelled) {
                    stream.getTracks().forEach(t => t.stop());
                    return;
                }

                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                onStatusChange?.("Camera active");
            } catch (err: any) {
                console.error("Camera initialization failed:", err);
                onError?.(`Camera Error: ${err.message || 'Access denied'}`);
            }
        };

        const initFaceMesh = async () => {
            try {
                onStatusChange?.("Loading MediaPipe...");
                const FaceMeshClass = await getFaceMesh();

                if (!FaceMeshClass) {
                    throw new Error("FaceMesh library not found. Check internet connection.");
                }

                onStatusChange?.("Initializing FaceMesh...");
                const faceMeshInstance = new FaceMeshClass({
                    locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
                });

                faceMeshInstance.setOptions({
                    maxNumFaces: 1,
                    refineLandmarks: true,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5,
                });

                faceMeshInstance.onResults((results: any) => {
                    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
                        const { isLookingAtScreen } = checkGaze(results.multiFaceLandmarks[0]);
                        onGazeUpdate(isLookingAtScreen);
                        onStatusChange?.("Tracking active");
                    } else {
                        onGazeUpdate(false);
                        onStatusChange?.("No face detected");
                    }
                });

                faceMeshRef.current = faceMeshInstance;
                onStatusChange?.("MediaPipe ready");
            } catch (err: any) {
                console.error("FaceMesh initialization failed:", err);
                onError?.(`MediaPipe Error: ${err.message}`);
            }
        };

        const runDetection = async () => {
            if (videoRef.current && faceMeshRef.current && isEnabled) {
                if (videoRef.current.readyState === 4) {
                    try {
                        await faceMeshRef.current.send({ image: videoRef.current });
                    } catch (err) {
                        console.error("Detection error:", err);
                    }
                }
                requestRef.current = requestAnimationFrame(runDetection);
            }
        };

        if (isEnabled) {
            initCamera().then(() => {
                if (!faceMeshRef.current) initFaceMesh();
                runDetection();
            });
        } else {
            onStatusChange?.("Idle");
            if (videoRef.current?.srcObject) {
                const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
                tracks.forEach(track => track.stop());
                videoRef.current.srcObject = null;
            }
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        }

        return () => {
            isCancelled = true;
            if (videoRef.current?.srcObject) {
                const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
                tracks.forEach(track => track.stop());
            }
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, [isEnabled, onGazeUpdate, onError, onStatusChange]);

    return (
        <div className="relative w-64 h-48 rounded-2xl overflow-hidden border-2 border-zinc-800 bg-zinc-900 shadow-2xl">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover grayscale opacity-50"
            />
            {!isEnabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80 backdrop-blur-sm">
                    <span className="text-zinc-500 text-xs font-medium uppercase tracking-widest">Camera Off</span>
                </div>
            )}
        </div>
    );
};
