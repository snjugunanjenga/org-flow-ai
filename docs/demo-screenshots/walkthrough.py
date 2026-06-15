"""Persona walkthroughs that capture screenshots into docs/demo-screenshots/.

Usage:
  python3 docs/demo-screenshots/walkthrough.py                # headless (CI/sandbox)
  HEADED=1 python3 docs/demo-screenshots/walkthrough.py       # headed (local laptop)
  BASE_URL=http://localhost:5173 python3 docs/demo-screenshots/walkthrough.py

Prereq: `supabase/functions/seed-personas` has been invoked at least once so the
three demo accounts exist. Run inside the dev sandbox or any environment that
can reach the Lovable Cloud project.
"""
import asyncio, json, os, sys
from pathlib import Path
from playwright.async_api import async_playwright

BASE_URL = os.environ.get("BASE_URL", "http://localhost:5173")
HEADED = os.environ.get("HEADED") == "1"
PASSWORD = os.environ.get("DEMO_PASSWORD", "Demo!2026")
OUT = Path(__file__).parent
OUT.mkdir(parents=True, exist_ok=True)

PERSONAS = [
    {"slug": "student",  "email": "student.demo@chiefofstaff.app",  "label": "Stanford CS Cohort"},
    {"slug": "pm",       "email": "pm.demo@chiefofstaff.app",       "label": "Northwind Product"},
    {"slug": "founder",  "email": "founder.demo@chiefofstaff.app",  "label": "Lumen Robotics"},
]

ROUTES = [
    ("01-overview",      "/dashboard"),
    ("02-projects",      "/dashboard/projects"),
    ("03-graph",         "/dashboard/graph"),
    ("04-agents",        "/dashboard/agents"),
    ("05-topics",        "/dashboard/topics"),
    ("06-teams",         "/dashboard/teams"),
    ("07-resources",     "/dashboard/resources"),
    ("08-calendar",      "/dashboard/calendar"),
    ("09-messages",      "/dashboard/messages"),
    ("10-notifications", "/dashboard/notifications"),
    ("11-analytics",     "/dashboard/analytics"),
    ("12-settings",      "/dashboard/settings"),
]

async def login(page, email: str) -> bool:
    await page.goto(f"{BASE_URL}/auth", wait_until="domcontentloaded")
    await page.fill('input#email', email)
    await page.fill('input#password', PASSWORD)
    await page.get_by_role("button", name="Sign in").click()
    try:
        await page.wait_for_url("**/dashboard**", timeout=15000)
        return True
    except Exception as e:
        print(f"  login wait failed: {e}; current url={page.url}")
        return False

async def capture_persona(browser, persona):
    persona_dir = OUT / persona["slug"]
    persona_dir.mkdir(parents=True, exist_ok=True)
    context = await browser.new_context(viewport={"width": 1440, "height": 900})
    page = await context.new_page()
    manifest = {"persona": persona["label"], "email": persona["email"], "shots": []}
    print(f"\n=== {persona['label']} ({persona['email']}) ===")
    if not await login(page, persona["email"]):
        await context.close()
        return manifest
    for name, route in ROUTES:
        try:
            await page.goto(f"{BASE_URL}{route}", wait_until="domcontentloaded")
            await page.wait_for_timeout(1500)  # let charts/queries settle
            path = persona_dir / f"{name}.png"
            await page.screenshot(path=str(path))
            print(f"  ✓ {name}")
            manifest["shots"].append({"name": name, "route": route, "file": str(path.relative_to(OUT))})
        except Exception as e:
            print(f"  ✗ {name}: {e}")
    await context.close()
    return manifest

async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=not HEADED)
        all_manifests = []
        for p in PERSONAS:
            all_manifests.append(await capture_persona(browser, p))
        await browser.close()
    (OUT / "manifest.json").write_text(json.dumps(all_manifests, indent=2))
    print(f"\nWrote manifest.json with {sum(len(m['shots']) for m in all_manifests)} screenshots → {OUT}")

if __name__ == "__main__":
    asyncio.run(main())
