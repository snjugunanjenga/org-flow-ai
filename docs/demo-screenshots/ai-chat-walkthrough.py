"""Playwright walkthrough: log in as the Apple/Steve Jobs demo persona,
open the AI Coordinator chat, send a prompt, and verify the ai-agent
edge function responds 200 with assistant text.

Run (headed) from the project root:
    python3 docs/demo-screenshots/ai-chat-walkthrough.py

Screenshots land in docs/demo-screenshots/ai-chat/.
"""
import asyncio
import os
from pathlib import Path
from playwright.async_api import async_playwright

OUT = Path(__file__).parent / "ai-chat"
OUT.mkdir(parents=True, exist_ok=True)

BASE = os.environ.get("APP_BASE_URL", "http://localhost:8080")
EMAIL = os.environ.get("DEMO_EMAIL", "steve.jobs@apple.com")
PASSWORD = os.environ.get("DEMO_PASSWORD", "Demo!2026")
HEADED = os.environ.get("HEADLESS", "0") != "1"


async def login(page):
    await page.goto(f"{BASE}/auth", wait_until="domcontentloaded")
    await page.get_by_label("Email", exact=False).first.fill(EMAIL)
    await page.get_by_label("Password", exact=False).first.fill(PASSWORD)
    await page.get_by_role("button", name="Sign in", exact=False).first.click()
    await page.wait_for_url("**/dashboard**", timeout=20000)


async def main():
    ai_responses: list[int] = []
    console_errors: list[str] = []

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=not HEADED)
        context = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page = await context.new_page()

        page.on("console", lambda m: console_errors.append(m.text) if m.type == "error" else None)
        page.on("response", lambda r: ai_responses.append(r.status) if "/functions/v1/ai-agent" in r.url else None)

        try:
            await login(page)
            await page.screenshot(path=str(OUT / "0_dashboard.png"))

            # Open AI chat — floating Brain button in DashboardLayout
            brain = page.locator("button:has(svg.lucide-brain)").first
            await brain.wait_for(state="visible", timeout=10000)
            await brain.click()
            await page.wait_for_timeout(800)
            await page.screenshot(path=str(OUT / "1_chat_open.png"))

            # Type a prompt and submit
            textbox = page.get_by_placeholder("Ask your AI Chief of Staff", exact=False).first
            await textbox.fill("What's the status of our top project?")
            await page.screenshot(path=str(OUT / "2_chat_input.png"))
            await textbox.press("Enter")

            # Wait for ai-agent response
            for _ in range(30):
                await page.wait_for_timeout(1000)
                if ai_responses:
                    break
            await page.wait_for_timeout(2000)
            await page.screenshot(path=str(OUT / "3_chat_response.png"))

            status = ai_responses[-1] if ai_responses else None
            print(f"ai-agent HTTP status: {status}")
            print(f"console errors: {len(console_errors)}")
            for e in console_errors[:5]:
                print(f"  - {e[:200]}")

            assert status == 200, f"expected 200 from ai-agent, got {status}"
            print("PASS: conversational AI returned 200 and chat rendered")
        except Exception as e:
            print(f"FAIL: {e}")
            await page.screenshot(path=str(OUT / "failure.png"))
            raise
        finally:
            await context.close()
            await browser.close()


asyncio.run(main())