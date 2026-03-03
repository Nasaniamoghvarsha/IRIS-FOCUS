# Contributing to Iris Focus 👁️

First off, thank you for considering contributing to Iris Focus! It's people like you that make it a better tool for everyone.

## 🌈 Code of Conduct
By participating in this project, you agree to abide by the same professional standards we expect of all developers: be respectful, constructive, and focused on building great tools.

## 🚀 How Can I Contribute?

### Reporting Bugs
- Use the GitHub Issues tab.
- Describe the bug precisely.
- Include your OS version (Windows 10/11) and camera model if applicable.
- Attach any logs from the Electron console.

### Suggesting Enhancements
- Open an issue with the [Enhancement] tag.
- Describe the use case and why it would help other users.

### Pull Requests
1. Fork the repo and create your branch from `main`.
2. Install dependencies with `npm install`.
3. Ensure your code follows the existing TypeScript patterns.
4. If you add a feature, please update `docs/architecture_overview.md` if the system flow changes.
5. Issue your PR!

## 🧪 Development Workflow
- **Frontend**: Vite-powered React in `src/`.
- **Backend**: Electron main process in `electron/`.
- **System**: Any new OS-level features should be implemented in `electron/ipcHandlers.ts` using safe PowerShell or P/Invoke wrappers.

## 📄 License
By contributing, you agree that your contributions will be licensed under its MIT License.
