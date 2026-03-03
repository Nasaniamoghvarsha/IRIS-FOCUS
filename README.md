# IRIS FOCUS | 👁️ Desktop Anti-Procrastination Assistant

Iris Focus is a privacy-first, professional concentration assistant that uses advanced eye-tracking AI to help you stay focused on your work.

---

## 🎯 The Iris Philosophy
Iris Focus doesn't just block websites; it monitors your **actual attention**. If you look away from your work window, look at your phone, or close your eyes, Iris Focus triggers a gentle audio penalty (focus music). As soon as you return your gaze to the screen, the music fades away.

### 🌟 Desktop-Exclusive Features
- **Focus Mode**: Locks your concentration by monitoring a specific target application (e.g., VS Code, Brave, Excel).
- **Precision PID Targeting**: Identifies exactly which process you are in, ensuring zero confusion between similar apps.
- **Auto-Pausing**: Intelligent enough to know when you are multitasking. Tracking pauses when you're in distraction apps, providing a flexible workflow.
- **Stealth Engine**: Runs in a specialized "Always-Alive" mode that prevents Windows from suspending the tracking logic during concentration sessions.

## 🛠️ Tech Stack
- **Framework**: Electron + React (Vite) + TypeScript
- **Machine Learning**: MediaPipe FaceMesh (100% On-Device)
- **Native Integration**: Windows PowerShell Bridge & P/Invoke (C# Native API)
- **Styling**: Vanilla CSS v3 + Tailwind Utilities

---

## 🏗️ Architecture & Flow
Iris Focus combines web technologies with native Windows power. For a deep dive into how the camera detection, PID matching, and audio engine interact, check our documentation:

👉 **[Internal Architecture & Flow Diagrams](docs/architecture_overview.md)**

---

## 🚀 Installation

### Development Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development environment:
   ```bash
   npm run electron:dev
   ```

### Hardware Requirements
- A standard Webcam (720p recommended).
- Windows 10/11 (for full native focus features).

## 📄 License & Privacy
- **Privacy Core**: Iris Focus never records or uploads video. Landmarks are processed in RAM and discarded instantly.
- **License**: MIT License.

---
*Stay focused. Be exceptional.*
