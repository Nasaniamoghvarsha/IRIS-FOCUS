# IRIS FOCUS 👁️🎵

A privacy-first, real-time concentration assistant that uses advanced eye-tracking to help you stay focused.

---

## 🎯 Project Overview
Iris Focus monitors your attention via your webcam and automatically plays focusing music when you look away or lose concentration (e.g., using your phone, closing your eyes, or turning your head). As soon as you return focus to the screen, the music fades out seamlessly.

### 🌟 Key Features
- **Privacy First**: 100% on-device processing. No video or gaze data ever leaves your browser.
- **Advanced Gaze Metrics**:
    - **Head Pose Estimation**: Detects Yaw (horizontal) and Pitch (vertical) head rotation.
    - **Blink & Eye Openness**: Measures eyelid distance (EAR) to detect closed eyes.
    - **Precision Iris Tracking**: Sub-degree accuracy using normalized iris offset.
    - **Mobile Usage Detection**: Specialized sensitivity for detecting downward gaze.
- **Seamless Audio**: High-performance Audio API with smooth volume fading and browser autoplay bypass.
- **Real-Time Debugging**: Integrated system panel for monitoring camera, audio, and tracking status.

## 🛠️ Tech Stack
- **Frontend**: React (Vite) + TypeScript
- **Styling**: Tailwind CSS v3
- **AI/ML**: MediaPipe FaceMesh + TensorFlow.js
- **Audio**: Custom AudioController with Volume Fading

## 🚀 Getting Started

### Local Development
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:5173` (or the port specified in your terminal).

## 📄 License & Contributing
This project is licensed under the **MIT License**. Check out `CONTRIBUTING.md` for guidelines on how to help improve Iris Focus!

---
*Built with privacy and productivity in mind.*
