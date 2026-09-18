# 🤖 Ultron-AI — Autonomous Event-Driven AI Agent

Ultron-AI is a modular, event-driven personal AI assistant designed to combine **local LLM reasoning, persistent memory, RAG-based knowledge retrieval, voice interaction, perception, and system automation**.

The system is built around local-first components such as **Ollama, NATS, SQLite, and ChromaDB**, allowing different services to communicate asynchronously while remaining independently executable.

---

## 🏗️ Current Architecture

Ultron-AI currently follows a decoupled event-driven architecture:

```text
                    ┌─────────────────────────────┐
                    │        NATS Message Bus     │
                    │     nats://localhost:4222   │
                    └──────────────┬──────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
              ▼                    ▼                    ▼
       ┌─────────────┐      ┌─────────────┐      ┌──────────────┐
       │   Vision    │      │    Audio    │      │    Brain     │
       │   gesture   │      │   Listener  │      │    Agent     │
       │    .py      │      │    .py      │      │  brain_agent │
       └─────────────┘      └─────────────┘      └──────┬───────┘
                                                        │
                                  ┌─────────────────────┼──────────────────┐
                                  │                     │                  │
                                  ▼                     ▼                  ▼
                           ┌─────────────┐      ┌─────────────┐    ┌─────────────┐
                           │   SQLite    │      │  ChromaDB   │    │   Actions   │
                           │   Memory    │      │    RAG      │    │   Daemon    │
                           └─────────────┘      └─────────────┘    └─────────────┘
```

The architecture is designed so that perception, reasoning, memory, and execution can evolve independently.

---

# ⚙️ Core Components

## 🧠 Brain Agent — `brain_agent.py`

The central reasoning and orchestration component of Ultron-AI.

- Uses **Ollama** for local LLM inference.
- Currently designed around the `qwen2.5` model family.
- Processes incoming user intents and contextual information.
- Supports tool/action routing.
- Includes fallback parsing for structured `<tool_call>` responses.
- Provides fuzzy filename/script resolution using Python's `difflib`.
- Coordinates system-level actions through the execution layer.

---

## 💾 Persistent Memory — `memory_db.py`

Provides persistent relational memory using **SQLite**.

Capabilities include:

- Long-term storage of user information.
- Persistent preferences and facts.
- Conversation history.
- Context restoration between sessions.
- SQLite WAL-based persistence.

The objective is to allow Ultron-AI to maintain useful context instead of treating every session as completely independent.

---

## 📚 Knowledge Base / RAG — `ingest.py`

Ultron-AI uses **ChromaDB** for local vector-based knowledge retrieval.

The RAG layer is intended for:

- Project documentation.
- Personal knowledge.
- Local manuals and reference material.
- Workspace-specific information.
- Context retrieval for the Brain Agent.

Vector data is stored locally under:

```text
chroma_db/
```

Knowledge sources are maintained under:

```text
knowledge_base/
```

---

## 👁️ Vision / Gesture Perception — `gesture.py`

Provides real-time computer-vision based gesture detection.

Current technology includes:

- MediaPipe
- OpenCV
- 3D hand landmarks
- Geometric gesture analysis

The vision layer is designed to act as a sensory input node rather than being tightly coupled to the Brain Agent.

---

## 🎙️ Audio / Voice Perception

### `audio_listen.py`

Provides acoustic signal processing for detecting audio events such as claps.

Current processing includes:

- Peak detection.
- RMS analysis.
- Crest-factor based audio analysis.
- NumPy / SciPy signal processing.

### `voice_listener.py`

Provides the voice interaction pipeline.

Its role is to:

```text
Speech → Recognition → Intent → NATS → Brain Agent
```

This allows voice input to be processed asynchronously by the rest of the system.

---

## ⚡ Action Execution — `action_daemon.py`

The execution layer handles actions requested by the Brain Agent.

Current responsibilities include:

- Asynchronous text-to-speech feedback.
- Non-blocking process execution.
- System automation.
- Action/task execution.

The daemon is intentionally separated from the Brain Agent so reasoning and execution remain independent components.

---

# 📨 NATS Messaging Mesh

Ultron-AI uses **NATS** as its event-driven communication layer.

Default local broker:

```text
nats://localhost:4222
```

NATS allows different Ultron services to communicate without requiring direct dependencies between them.

Current messaging-related modules include:

```text
mesh_pub.py
mesh_sub.py
send_intent.py
```

---

# 🗂️ Current Project Structure

```text
Ultron-core/
│
├── .venv/                  # Local Python virtual environment
├── .vscode/
│   └── settings.json       # VS Code interpreter configuration
│
├── chroma_db/              # ChromaDB vector storage
├── knowledge_base/         # Local RAG knowledge sources
├── nats_data/              # NATS-related local data
│
├── action_daemon.py        # Action execution service
├── audio_listen.py         # Audio event detection
├── brain_agent.py          # Central AI reasoning agent
├── gesture.py              # Vision / gesture perception
├── ingest.py               # RAG knowledge ingestion
├── memory_db.py            # SQLite persistent memory
│
├── mesh_pub.py             # NATS publisher
├── mesh_sub.py             # NATS subscriber
├── send_intent.py          # Intent publisher
├── send_prompt.py          # Prompt interface
├── voice_listener.py       # Voice interaction
│
├── docker-compose.yml      # Infrastructure configuration
├── requirements.txt        # Python dependencies
├── .env.example            # Environment variable template
├── .gitignore
└── README.md
```

---

# 🚀 Setup

## 1. Prerequisites

Install:

- Python 3.11+
- Docker Desktop
- Ollama
- Git

---

## 2. Clone the Repository

```bash
git clone <repository-url>
cd Ultron-core
```

---

## 3. Create the Virtual Environment

Create a project-local Python environment:

```powershell
python -m venv .venv
```

Activate it in PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

For Command Prompt:

```cmd
.\.venv\Scripts\activate.bat
```

For Git Bash:

```bash
source .venv/Scripts/activate
```

---

## 4. VS Code Environment

Ultron-AI is configured to automatically use its local `.venv`.

The workspace configuration is located at:

```text
.vscode/settings.json
```

Current configuration:

```json
{
    "python.defaultInterpreterPath": "${workspaceFolder}\\.venv\\Scripts\\python.exe",
    "python.terminal.activateEnvironment": true
}
```

Therefore, new VS Code terminals should use:

```text
(.venv) PS C:\Users\Krish\Ultron-core>
```

---

## 5. Install Dependencies

With `.venv` activated:

```powershell
python -m pip install -r requirements.txt
```

Additional runtime dependencies currently required by the Brain Agent include:

```powershell
python -m pip install keyboard psutil pyperclip duckduckgo-search
```

---

## 6. Environment Variables

Create the local environment file:

```powershell
Copy-Item .env.example .env
```

Then configure the required values inside `.env`.

> `.env` should never be committed to Git.

---

# 🐳 Infrastructure

Start the local NATS infrastructure using Docker:

```powershell
docker-compose up -d
```

Verify that the required containers are running:

```powershell
docker ps
```

---

# 🧠 Ollama

Ultron-AI uses Ollama for local LLM inference.

Ensure Ollama is running and that the required model is available.

Example:

```powershell
ollama list
```

If required, pull the configured model:

```powershell
ollama pull qwen2.5:7b
```

---

# ▶️ Running Ultron-AI

The current services can be launched independently.

### Terminal 1 — Action Daemon

```powershell
python action_daemon.py
```

### Terminal 2 — Brain Agent

```powershell
python brain_agent.py
```

### Terminal 3 — Voice Listener

```powershell
python voice_listener.py
```

Additional perception, messaging, and RAG services can be started independently as required.

---

# 🧪 Development Philosophy

Ultron-AI is being developed around several principles:

- **Local-first AI**
- **Event-driven communication**
- **Modular services**
- **Persistent memory**
- **Retrieval-augmented reasoning**
- **Non-blocking execution**
- **Fault isolation**
- **Extensible perception and action nodes**

The architecture is intended to support future integrations such as:

```text
Ultron Core
     │
     ├── Voice Gateway
     ├── Vision Gateway
     ├── Mobile / iPhone Gateway
     ├── Scheduler Engine
     ├── Automation Layer
     └── External Service Integrations
```

These components represent the planned expansion of the system and are not necessarily implemented yet.

---

# 🛠️ Technology Stack

| Component | Technology |
|---|---|
| Language | Python |
| LLM | Ollama |
| Model | Qwen 2.5 |
| Messaging | NATS |
| Relational Memory | SQLite |
| Vector Database | ChromaDB |
| Vision | MediaPipe / OpenCV |
| Audio Processing | NumPy / SciPy |
| Automation | Python system APIs |
| Infrastructure | Docker |
| Development | VS Code / Git |

---

# 📌 Development Status

Ultron-AI is under active development.

### Currently implemented

- Local Python virtual environment
- Ollama-based Brain Agent
- Persistent SQLite memory
- ChromaDB-based RAG infrastructure
- NATS messaging infrastructure
- Voice perception
- Gesture perception
- Action daemon
- Modular event-driven communication

### Planned

- iPhone Gateway
- Scheduler Engine
- Expanded tool ecosystem
- Improved autonomous task execution
- Advanced multimodal perception
- More robust memory and context management
- Expanded automation capabilities

---

## 🔐 License & Ownership

**Copyright © 2026. All Rights Reserved.**

This repository and its source code are **proprietary**.

Permission is granted solely to view the code for educational and demonstration purposes.

No part of this software may be reproduced, distributed, modified, or used in commercial applications without explicit prior written consent from the owner.