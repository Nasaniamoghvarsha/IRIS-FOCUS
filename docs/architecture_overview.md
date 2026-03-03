# Architecture Overview: Iris Focus Desktop

Iris Focus is built as a highly performant desktop assistant that combines real-time AI computer vision with native system integrations for professional productivity monitoring.

## 🏗️ High-Level Component Diagram

```mermaid
graph TD
    subgraph "Renderer Process (React/Vite)"
        UI[User Interface]
        CV[CameraView Component]
        ML[MediaPipe FaceMesh AI]
        GS[useGazeState Hook]
        AC[AudioController]
    end

    subgraph "Main Process (Electron)"
        MP[Main Entry]
        WM[WindowMonitor]
        IPC[IPC Handlers]
        PS[PowerShell Bridge]
    end

    subgraph "Native Windows OS"
        WIN[Active-Win API]
        SHELL[CMD/PowerShell]
        PI[P/Invoke API]
    end

    CV -->|video stream| ML
    ML -->|landmark data| UI
    UI -->|gaze updates| GS
    GS -->|trigger| AC
    UI <-->|electronAPI| IPC
    IPC <-->|monitoring| WM
    WM <-->|active window| WIN
    IPC <-->|native scripts| PS
    PS <-->|SetForegroundWindow| PI
    PS <-->|Get-Process| SHELL
```

## 🔄 Focus Mode Flow

```mermaid
sequenceDiagram
    participant U as User
    participant R as React Frontend
    participant E as Electron Main
    participant S as System (Windows)

    U->>R: Enable Focus Mode (Select App)
    R->>E: ipc:toggle-focus-mode(true)
    E->>S: P/Invoke: SetForegroundWindow(Target)
    E->>E: WindowMonitor: Watch Focus
    
    loop Real-time Tracking
        R->>R: Camera -> AI Detection
        E->>R: ipc:window-change (Active-Win)
        R->>R: Check isTargetActive
        alt In Target App + Looking Away
            R->>R: Start Away Timer (3s)
            R->>R: playMusic() [Penalty]
        else Switched to Chrome / Distraction
            R->>R: Stop Music [Paused State]
        else Focused in Target
             R->>R: stopMusic()
        end
    end
```

## 🧠 Key Logic Components

### Gaze Detection Algebra (`gazeMath.ts`)
The intelligence of Iris Focus lies in its normalized tracking logic:
- **Pitch/Yaw Validation**: Uses 3D landmark rotation.
- **Iris Offset**: Measures relative position of the iris within the eye boundaries.
- **EAR (Eye Aspect Ratio)**: Detects blinks vs. long-term eye closure.

### Precision Window Targeting
Unlike traditional web-based trackers, Iris Focus uses **Process IDs (PID)** to identify windows. This allows for 100% accurate detection even when multiple browser instances are running (e.g., distinguishing between a Brave "Work" window and a "Personal" window).

### Industrial Persistence
To prevent the OS from suspending the tracker when the app is "minimized", Iris Focus transforms its main window into a **1x1 transparent, always-on-top node**. This tricks the OS into maintaining full hardware priority for the camera and audio engines.
