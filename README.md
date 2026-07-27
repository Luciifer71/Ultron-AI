# 🤖 Ultron-AI — Autonomous Event-Driven Microservice Mesh

An **asynchronous, fault-tolerant perception and action pipeline** designed for real-time **computer vision**, **acoustic digital signal processing (DSP)**, and **non-blocking operating system control**.

---

## 🏗️ System Architecture

Ultron-AI uses a **decoupled, event-driven microservice architecture** built on top of a lightweight **NATS messaging mesh**.

Each sensory component operates as an independent producer node, broadcasting **JSON payloads** to subscriber daemons without blocking the core event loop.

```text
              +-------------------------------+
              |       NATS Network Mesh       |
              |     nats://localhost:4222     |
              +---------------+---------------+
                              |
     +------------------------+------------------------+
     |                        |                        |
     v                        v                        v
+------------------+     +------------------+     +-------------------+
|   Vision Node    |     |    Audio Node    |     |   Action Daemon   |
|   (gesture.py)   |     |(audio_listen.py) |     |(action_daemon.py) |
| MediaPipe 3D DSP |     |  Peak/RMS Ratio  |     | SAPI5 TTS Engine  |
+------------------+     +------------------+     +-------------------+
```

---

## ⚙️ Core Microservices

### 👁️ Perception / Vision — `gesture.py`

Real-time **MediaPipe 3D hand landmark tracking** that calculates rotation-invariant hand geometry for gesture-based interaction.

### 🎙️ Perception / Audio — `audio_listen.py`

Acoustic **DSP module** that evaluates **Peak-to-RMS Crest Factor ratios** to distinguish physical impact claps from human speech and other ambient sounds.

### ⚡ Execution / Action Daemon — `action_daemon.py`

Multi-threaded operating system control hub responsible for:

* Asynchronous TTS voice feedback
* Non-blocking process automation
* Event-driven action execution

### 🌐 Network Infrastructure — `docker-compose.yml`

Local **NATS broker** container orchestration providing the messaging backbone for communication between independent microservices.

The NATS server operates on:

```text
nats://localhost:4222
```

---

## 🚀 Quickstart

### Prerequisites

Make sure the following are installed:

* **Python 3.11+**
* **Docker Desktop**
* **pip**

---

### 1. Launch the Infrastructure

Start the NATS messaging broker using Docker Compose:

```bash
docker-compose up -d
```

---

### 2. Install Dependencies

Install all required Python packages:

```bash
pip install -r requirements.txt
```

---

### 3. Start the Microservice Mesh

Launch each daemon in a **separate terminal session**.

#### Terminal 1 — Action Execution Hub

```bash
python action_daemon.py
```

#### Terminal 2 — Audio DSP Sensor

```bash
python audio_listen.py
```

#### Terminal 3 — Computer Vision Sensor

```bash
python gesture.py
```

Once all three services are running, the nodes communicate asynchronously through the local **NATS messaging mesh**.

---

## 🔄 Event Flow

```text
Vision Sensor ─────┐
                   │
                   ├──► NATS Message Broker ──► Action Daemon ──► OS Actions
                   │
Audio Sensor ──────┘
```

The perception services independently detect events and publish structured messages to the NATS broker. The Action Daemon subscribes to relevant event topics and executes the corresponding system actions without blocking the perception pipelines.

---

## 🧩 Architecture Overview

| Component       | File                 | Responsibility                            |
| --------------- | -------------------- | ----------------------------------------- |
| 👁️ Vision Node | `gesture.py`         | MediaPipe-based 3D hand gesture detection |
| 🎙️ Audio Node  | `audio_listen.py`    | Acoustic DSP and clap detection           |
| ⚡ Action Daemon | `action_daemon.py`   | TTS feedback and OS automation            |
| 🌐 NATS Broker  | `docker-compose.yml` | Event-driven messaging infrastructure     |

---

## 🛠️ Technology Stack

* **Python 3.11+**
* **NATS**
* **Docker**
* **MediaPipe**
* **Computer Vision**
* **Digital Signal Processing (DSP)**
* **SAPI5 Text-to-Speech**
* **Asynchronous Event Processing**
* **Multi-threaded OS Automation**

---

## 📄 License & Ownership

**Copyright © 2026. All Rights Reserved.**

This repository and its source code are **proprietary**.

Permission is granted solely to view the code for educational and demonstration purposes.

No part of this software may be reproduced, distributed, modified, or used in commercial applications without explicit prior written consent from the owner.
