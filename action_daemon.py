import asyncio
import ctypes
import json
import os
import queue
import subprocess
import sys
import threading
import webbrowser

import pyttsx3
from nats.aio.client import Client as NATS

NATS_URL = "nats://localhost:4222"
SUBJECT = "ultron.>"


class VoiceEngine:
  """Dedicated background worker thread for pyttsx3 on Windows SAPI5."""

  def __init__(self):
    self.speech_queue = queue.Queue()
    self.thread = threading.Thread(target=self._speech_worker, daemon=True)
    self.thread.start()

  def _speech_worker(self):
    try:
      engine = pyttsx3.init()
      engine.setProperty("rate", 140)
      voices = engine.getProperty("voices")
      for voice in voices:
        if "david" in voice.name.lower() or "male" in voice.name.lower():
          engine.setProperty("voice", voice.id)
          break

      while True:
        text = self.speech_queue.get()
        if text is None:
          break
        print(f"[ULTRON VOICE]: \"{text}\"")
        engine.say(text)
        engine.runAndWait()
        self.speech_queue.task_done()
    except Exception as e:
      print(f"[TTS ENGINE NOTICE]: Voice output disabled ({e})")

  def speak(self, text):
    self.speech_queue.put(text)


class ActionDaemon:

  def __init__(self):
    self.nc = NATS()
    self.voice = VoiceEngine()
    self.cooldowns = {}

  def is_cooled_down(self, event_type, seconds=3.0):
    now = asyncio.get_event_loop().time()
    last = self.cooldowns.get(event_type, 0)
    if now - last > seconds:
      self.cooldowns[event_type] = now
      return True
    return False

  async def message_handler(self, msg):
    try:
      data = json.loads(msg.data.decode())

      # FIX 1: Extract event name checking BOTH 'event' and 'gesture' keys
      event_type = data.get("event") or data.get("gesture")

      print(
          f"[ACTION DAEMON RECEIVED]: Subject='{msg.subject}',"
          f" Event='{event_type}'"
      )

      if not event_type:
        return

      # 1. CLAP DETECTED -> Open Browser
      if event_type == "clap_detected":
        if self.is_cooled_down("clap"):
          self.voice.speak(
              "Acoustic pulse confirmed. Launching network browser."
          )
          webbrowser.open("https://www.google.com")

      # 2. PALM OPEN -> Launch Notepad
      elif event_type == "PALM OPEN":
        if self.is_cooled_down("palm"):
          self.voice.speak(
              "Visual confirmation received. Opening primary workspace."
          )
          subprocess.Popen(["notepad.exe"])

      # 3. FIST DETECTED -> Lock PC
      elif event_type == "FIST DETECTED":
        if self.is_cooled_down("fist"):
          self.voice.speak("Defense protocol active. Locking workstation.")
          if sys.platform == "win32":
            ctypes.windll.user32.LockWorkStation()

    except Exception as e:
      print(f"[DAEMON ERROR]: Failed to process message: {e}")

  async def start(self):
    await self.nc.connect(NATS_URL)
    print(f"[ULTRON] Action daemon online. Subscribed to '{SUBJECT}'...")
    self.voice.speak("Ultron core action daemon online.")
    await self.nc.subscribe(SUBJECT, cb=self.message_handler)

    while True:
      await asyncio.sleep(1)


if __name__ == "__main__":
  daemon = ActionDaemon()
  try:
    asyncio.run(daemon.start())
  except KeyboardInterrupt:
    print("\n[ULTRON] Action daemon shutting down.")