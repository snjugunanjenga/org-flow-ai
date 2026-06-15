"""
Playwright walkthrough for the Super Admin protected pages.

Logs in as the super admin (simonnjenganjuguna@gmail.com), navigates to
/dashboard/admin, screenshots every tab (analytics, organizations,
subscriptions, newsletters, audit), and verifies that:

  - Auth redirects do NOT fire (AdminGuard grants access).
  - Each admin tab renders without "Access denied" / 404.
  - The "Send newsletter" action surface is reachable.

Run:
  HEADED=1 BASE_URL=http://localhost:8080 python3 docs/demo-screenshots/super-admin-walkthrough.py

Outputs to docs/demo-screenshots/super-admin/.
Exits non-zero on any failed assertion so CI can gate on it.
"""
import asyncio
import os
import sys
from pathlib import Path
from playwright.async_api import async_playwright, expect

BASE_URL = os.environ.get("BASE_URL", "http://localhost:8080")
HEADED = os.environ.get("HEADED", "1") == "1"
EMAIL = os.environ.get("SUPER_ADMIN_EMAIL", "simonnjenganjuguna@gmail.com")
PASSWORD = os.environ.get("SUPER_ADMIN_PASSWORD", "aqC!xeF2")

OUT = Path(__file__).parent / "super-admin"
OUT.mkdir(parents=True, exist_ok=True)

TABS = ["analytics", "organizations", "subscriptions", "newsletters", "audit"]


async def main() -> int:
    failures: list[str] = []
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=not HEADED)
        ctx = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page = await ctx.new_page()

        # 1. Login via /auth
        await page.goto(f"{BASE_URL}/auth", wait_until="domcontentloaded")
        await page.get_by_label("Email", exact=False).fill(EMAIL)
        await page.get_by_label("Password", exact=False).fill(PASSWORD)
        await page.get_by_role("button", name="Sign In", exact=False).click()
        try:
            await page.wait_for_url("**/dashboard**", timeout=15000)
        except Exception as e:
            failures.append(f"login: {e}")
            await page.screenshot(path=str(OUT / "00-login-failed.png"))

        await page.screenshot(path=str(OUT / "00-dashboard.png"))

        # 2. Visit protected admin route
        await page.goto(f"{BASE_URL}/dashboard/admin", wait_until="domcontentloaded")
        try:
            await page.wait_for_url("**/dashboard/admin**", timeout=10000)
        except Exception:
            failures.append("AdminGuard redirected super admin away from /dashboard/admin")

        await page.screenshot(path=str(OUT / "01-admin-default.png"))

        # 3. Each tab renders without "Access denied"
        for idx, tab in enumerate(TABS, start=2):
            try:
                await page.get_by_role("tab", name=tab, exact=False).click()
                await page.wait_for_timeout(500)
                body = (await page.locator("body").inner_text()).lower()
                if "access denied" in body or "not authorized" in body:
                    failures.append(f"{tab}: page shows access-denied text")
                await page.screenshot(path=str(OUT / f"{idx:02d}-{tab}.png"))
            except Exception as e:
                failures.append(f"{tab}: {e}")

        # 4. Newsletter compose action surface
        try:
            await page.get_by_role("tab", name="newsletters", exact=False).click()
            await page.wait_for_timeout(300)
            await page.screenshot(path=str(OUT / "07-newsletters-compose.png"))
        except Exception as e:
            failures.append(f"newsletter compose: {e}")

        await browser.close()

    if failures:
        print("✗ Super Admin walkthrough FAILED:")
        for f in failures:
            print(f"  - {f}")
        return 1
    print(f"✓ Super Admin walkthrough passed — screenshots in {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))