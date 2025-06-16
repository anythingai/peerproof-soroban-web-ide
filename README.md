# PeerProof Soroban Web IDE

A browser-based integrated development environment for writing, compiling, deploying, and testing Soroban (Stellar/XLM) smart contracts. Built with React, FastAPI, and Docker for a seamless development experience.

## ✨ Features

### 🎯 Core Functionality

- **Monaco Editor**: Full-featured code editor with Rust syntax highlighting and auto-completion
- **Multi-file Projects**: File tree navigation with support for complex project structures
- **One-click Compilation**: Fast Rust-to-WASM compilation with build caching
- **Easy Deployment**: Deploy contracts to Stellar Futurenet and Mainnet with a single click
- **Contract Interaction**: Generate and test contract functions with a user-friendly interface
- **Account Management**: Built-in account creation and funding via Friendbot

### 🚀 Advanced Features

- **Real-time Build Output**: WebSocket-powered live compilation feedback
- **Build Caching**: SHA-256 based caching for sub-15 second compile-deploy cycles
- **Network Support**: Futurenet, Testnet, and Mainnet compatibility
- **Persistent Storage**: Local storage for projects, accounts, and deployment history
- **Error Handling**: Comprehensive error messages and debugging information

## 🏗️ Architecture

The IDE follows a modern microservices architecture:

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18 (npm included)
- Python >= 3.11
- pip
- Docker & Docker Compose (optional)
- Rust toolchain (rustup & cargo)
- Soroban CLI (install via `cargo install --locked soroban-cli`)
- WebAssembly target for Rust: `rustup target add wasm32-unknown-unknown`

### Running in Development Mode

#### 1. Backend (FastAPI)

```bash
pip install -r services/compiler/requirements.txt
cd services/compiler
python main.py
```

The backend will be available at <http://localhost:8000>

#### 2. Frontend (Vite + React)

```bash
cd apps/soroban-ide
npm install
npm run dev
```

The frontend will be available at <http://localhost:5000> (proxies `/api` to backend)

### Running with Docker Compose

Alternatively, build and start all services with Docker Compose:

```bash
docker-compose up --build
```

- Backend: <http://localhost:8000>
- Frontend & Proxy: <http://localhost> (via nginx on port 80)
