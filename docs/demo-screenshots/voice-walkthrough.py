"""Playwright walkthrough: log in as each demo persona, verify the
Notifications view exposes voice playback affordances and the
Talk to Coordinator button mounts without runtime errors.

Run from the project root:
    python3 docs/demo-screenshots/voice-walkthrough.py

Screenshots land in docs/demo-screenshots/voice/.
"""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

OUT = Path(__file__).parent / "voice"
OUT.mkdir(parents=True, exist_ok=True)

PERSONAS = [
    ("apple", "steve.jobs@apple.com", "Demo!2026"),
    ("founder", "founder.demo@chiefofstaff.app", "Demo!2026"),
    ("pm", "pm.demo@chiefofstaff.app", "Demo!2026"),
    ("student", "student.demo@chiefofstaff.app", "Demo!2026"),
]

BASE = "http://localhost:8080"


async def login(page, email, password):
    await page.goto(f"{BASE}/auth", wait_until="domcontentloaded")
    await page.get_by_label("Email", exact=False).first.fill(email)
    await page.get_by_label("Password", exact=False).first.fill(password)
    await page.get_by_role("button", name="Sign in", exact=False).first.click()
    await page.wait_for_url("**/dashboard**", timeout=15000)


async def verify_persona(page, slug):
    errors: list[str] = []
    page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))

    await page.goto(f"{BASE}/dashboard/notifications", wait_until="domcontentloaded")
    await page.wait_for_timeout(1500)
    await page.screenshot(path=str(OUT / f"{slug}_notifications.png"))

    # Voice playback affordance: any button labelled "Play voice" must exist.
    play_buttons = page.get_by_role("button", name="Play voice", exact=False)
    play_count = await play_buttons.count()
    assert play_count > 0, f"{slug}: no voice playback buttons found"

    # Talk to Coordinator entry point — search by accessible name; if not on
    # this page, it lives in the dashboard layout floating button.
    coord = page.get_by_role("button", name="Talk to Coordinator", exact=False)
    if await coord.count() == 0:
        await page.goto(f"{BASE}/dashboard", wait_until="domcontentloaded")
        await page.wait_for_timeout(1000)
        coord = page.get_by_role("button", name="Talk to Coordinator", exact=False)
    assert await coord.count() > 0, f"{slug}: Talk to Coordinator button not mounted"
    await coord.first.click()
    await page.wait_for_timeout(1500)
    await page.screenshot(path=str(OUT / f"{slug}_coordinator.png"))

    # We don't require an upstream ElevenLabs session; we only assert the UI
    # loaded without throwing.
    assert not errors, f"{slug}: runtime errors {errors}"
    print(f"PASS {slug}: voice playback + coordinator UI OK")


async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        for slug, email, password in PERSONAS:
            context = await browser.new_context(viewport={"width": 1280, "height": 1800})
            page = await context.new_page()
            try:
                await login(page, email, password)
                await verify_persona(page, slug)
            except Exception as e:
                print(f"FAIL {slug}: {e}")
                await page.screenshot(path=str(OUT / f"{slug}_failure.png"))
            finally:
                await context.close()
        await browser.close()


asyncio.run(main())