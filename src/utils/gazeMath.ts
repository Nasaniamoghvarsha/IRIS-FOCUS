/**
 * Gaze Mathematics Utility
 * 
 * This module provides the logic for estimating user focus based on facial landmarks.
 * It combines head pose (Yaw/Pitch), Eye Aspect Ratio (EAR) for blink detection,
 * and normalized Iris offset tracking.
 * 
 * All processing is done locally to ensure user privacy.
 */

export interface EyeLandmarks {
  eyeBounds: { minX: number; maxX: number; minY: number; maxY: number };
  irisCenter: { x: number; y: number };
}

/**
 * checkGaze: Analyzes 478 MediaPipe FaceMesh landmarks to determine focus state.
 * 
 * @param landmarks - Array of normalized 3D landmarks from MediaPipe FaceMesh
 * @returns Object containing focus status and confidence score
 */
export const checkGaze = (landmarks: any): { isLookingAtScreen: boolean; confidence: number } => {
  // Ensure we have the required iris landmarks (468-477)
  if (!landmarks || landmarks.length < 478) {
    return { isLookingAtScreen: false, confidence: 0 };
  }

  /**
   * Calculates normalized iris offset within the eye bounds.
   * Logic: Map absolute iris position to a -0.5 to 0.5 range relative to the eye's center.
   */
  const getIrisOffset = (irisIndices: number[], eyeIndices: number[]) => {
    const iris = irisIndices.map(i => landmarks[i]);
    const eye = eyeIndices.map(i => landmarks[i]);

    // Calculate Iris Center
    const irisX = iris.reduce((acc, p) => acc + p.x, 0) / iris.length;
    const irisY = iris.reduce((acc, p) => acc + p.y, 0) / iris.length;

    // Calculate Eye Bounding Box
    const eyeBox = {
      minX: Math.min(...eye.map(p => p.x)),
      maxX: Math.max(...eye.map(p => p.x)),
      minY: Math.min(...eye.map(p => p.y)),
      maxY: Math.max(...eye.map(p => p.y)),
    };

    const eyeWidth = eyeBox.maxX - eyeBox.minX;
    const eyeHeight = eyeBox.maxY - eyeBox.minY;
    const centerX = (eyeBox.minX + eyeBox.maxX) / 2;
    const centerY = (eyeBox.minY + eyeBox.maxY) / 2;

    // Return normalized offset relative to eye dimensions
    return {
      x: (irisX - centerX) / eyeWidth,
      y: (irisY - centerY) / eyeHeight
    };
  };

  /**
   * 1. Head Pose Estimation (Yaw & Pitch)
   * We approximate rotation by comparing fixed facial features (Nose vs Face Edges).
   */
  const leftFaceEdge = landmarks[234].x;
  const rightFaceEdge = landmarks[454].x;
  const noseTipX = landmarks[1].x;
  const faceWidth = rightFaceEdge - leftFaceEdge;
  // Yaw: Horizontal turn (-0.5 to 0.5)
  const yaw = (noseTipX - (leftFaceEdge + rightFaceEdge) / 2) / faceWidth;

  const topFaceEdge = landmarks[10].y;
  const bottomFaceEdge = landmarks[152].y;
  const noseTipY = landmarks[1].y;
  const faceHeight = bottomFaceEdge - topFaceEdge;
  // Pitch: Vertical tilt (-0.5 to 0.5)
  const pitch = (noseTipY - (topFaceEdge + bottomFaceEdge) / 2) / faceHeight;

  /**
   * 2. Iris Offset Calculation
   * Higher precision mapping using fuller eye ring indices.
   */
  const leftEyeIndices = [33, 133, 160, 153, 158, 144];
  const rightEyeIndices = [362, 263, 387, 373, 385, 380];

  const leftIris = getIrisOffset([468, 469, 470, 471, 472], leftEyeIndices);
  const rightIris = getIrisOffset([473, 474, 475, 476, 477], rightEyeIndices);

  const avgIrisX = (leftIris.x + rightIris.x) / 2;
  const avgIrisY = (leftIris.y + rightIris.y) / 2;

  /**
   * 3. Eye Openness Detection (Blink Logic)
   * Measures the ratio of eyelid height to eye width.
   */
  const leftEyelidDist = Math.abs(landmarks[159].y - landmarks[145].y);
  const rightEyelidDist = Math.abs(landmarks[386].y - landmarks[374].y);
  const avgEyelidDist = (leftEyelidDist + rightEyelidDist) / 2;

  const eyeWidthRef = Math.abs(landmarks[133].x - landmarks[33].x);
  const eyeOpenness = avgEyelidDist / eyeWidthRef;

  /**
   * 4. Multi-factor Concentration Decision
   * Values tuned for desktop usage (roughly ±15° head/eye movement).
   */
  const MAX_YAW = 0.12;
  const MAX_PITCH = 0.15;
  const MAX_IRIS_X = 0.15;
  const MAX_IRIS_Y_UP = 0.12;
  const MAX_IRIS_Y_DOWN = 0.08; // Tighter downward threshold for mobile usage detection
  const MIN_EYE_OPENNESS = 0.08; // Below this, eyes are considered closed

  const isHeadCentered = Math.abs(yaw) < MAX_YAW && Math.abs(pitch) < MAX_PITCH;
  const areEyesCentered = Math.abs(avgIrisX) < MAX_IRIS_X && (avgIrisY < MAX_IRIS_Y_DOWN && avgIrisY > -MAX_IRIS_Y_UP);
  const areEyesOpen = eyeOpenness > MIN_EYE_OPENNESS;

  // Total Focus requires Head, Eyes, and Openness to be within bounds
  const isLooking = isHeadCentered && areEyesCentered && areEyesOpen;

  return {
    isLookingAtScreen: isLooking,
    confidence: isLooking ? 0.9 : 1.0
  };
};
