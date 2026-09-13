import asyncio
import json
import sys
from nats.aio.client import Client as NATS


async def main():
  prompt = (
      sys.argv[1]
      if len(sys.argv) > 1
      else "Ultron, evaluate system diagnostics."
  )

  nc = NATS()
  await nc.connect("nats://localhost:4222")
  await nc.publish("ultron.intent", json.dumps({"prompt": prompt}).encode())
  await nc.close()
  print(f"[TEST SENT TO ULTRON]: '{prompt}'")


if __name__ == "__main__":
  asyncio.run(main())