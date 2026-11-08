import json, urllib.request
from playwright.sync_api import sync_playwright, expect

BASE = "http://localhost:3000"
results = []
def check(name, ok, detail=""):
    results.append((name, bool(ok), detail))
    print(("PASS " if ok else "FAIL ") + name + (f"  -> {detail}" if detail else ""))

def rest(path, token):
    r = urllib.request.Request(f"http://localhost:54321/rest/v1/{path}", headers={"Authorization": f"Bearer {token}"})
    return json.load(urllib.request.urlopen(r))

def login(pg, email, pw):
    pg.goto(f"{BASE}/#giris", wait_until="networkidle")
    pg.get_by_role("button", name="Şifre ile Giriş", exact=True).click()
    pg.locator("input[type=email]").fill(email)
    pg.locator("input[type=password]").fill(pw)
    pg.locator("form button[type=submit]").click()

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    ctx = b.new_context(viewport={"width": 1280, "height": 800})
    pg = ctx.new_page()
    page_errors = []
    pg.on("pageerror", lambda e: page_errors.append(str(e)[:200]))
    pg.on("dialog", lambda d: d.accept())

    # 1. wrong password
    login(pg, "claude@claude.com", "yanlis-sifre")
    try:
        pg.get_by_text("Invalid login credentials").wait_for(timeout=5000); check("Yanlış şifre hata mesajı gösterir", True)
    except Exception as e:
        check("Yanlış şifre hata mesajı gösterir", False, "mesaj görünmedi")
    pg.screenshot(path="shots/10-wrong-pw.png")

    # 2. correct login
    login(pg, "claude@claude.com", "12345678")
    try:
        pg.get_by_role("button", name="Yeni Organizasyon Oluştur").wait_for(timeout=8000)
        check("Doğru şifre ile giriş + organizasyon ekranı", "#organizasyon" in pg.url)
    except Exception as e:
        check("Doğru şifre ile giriş + organizasyon ekranı", False, pg.url)

    # 3. org + project
    pg.get_by_role("button", name="Yeni Organizasyon Oluştur").click()
    pg.locator("input[placeholder='ör. Deneyap Ekibi']").fill("Demo Org")
    pg.get_by_role("button", name="Oluştur").click()
    try:
        pg.get_by_role("button", name="Yeni Proje Oluştur").wait_for(timeout=8000); check("Organizasyon oluşturuldu", True)
    except Exception: check("Organizasyon oluşturuldu", False, pg.url)
    pg.get_by_role("button", name="Yeni Proje Oluştur").click()
    pg.locator("input[placeholder='ör. TerraGuard']").fill("Demo Projesi")
    pg.get_by_role("button", name="Oluştur").click()
    try:
        pg.wait_for_url("**#pano/**", timeout=8000); check("Proje oluşturuldu ve pano açıldı", True)
    except Exception: check("Proje oluşturuldu ve pano açıldı", False, pg.url)
    pg.get_by_text("Yapılacaklar").first.wait_for()

    # 4. invite
    pg.get_by_role("button", name="Üyeler").click()
    pg.locator("input[type=email]").fill("olmayan@kullanici.com")
    pg.get_by_role("button", name="Ekle", exact=True).click()
    pg.wait_for_timeout(800); pg.screenshot(path="shots/11-invite-notfound.png")
    nf = pg.locator("p.text-rose-600").count() > 0
    check("Kayıtsız e-posta için 'bulunamadı' uyarısı", nf, pg.locator("p.text-rose-600").first.inner_text() if nf else "uyarı yok")
    pg.locator("input[type=email]").fill("demo@demo.com")
    pg.get_by_role("button", name="Ekle", exact=True).click()
    try:
        pg.get_by_text("Üye eklendi.").wait_for(timeout=5000); check("demo@demo.com davet edildi (Üye eklendi.)", True)
    except Exception: check("demo@demo.com davet edildi (Üye eklendi.)", False)
    pg.screenshot(path="shots/12-invite-ok.png")
    # 5. close modal
    pg.locator("div.fixed button").first.click()
    pg.wait_for_timeout(500)

    # 6. new task
    pg.locator("header button, nav button, div button").filter(has=pg.locator("svg")).last.click()
    pg.get_by_placeholder("Görevin adını yazın...").wait_for(timeout=4000)
    pg.get_by_placeholder("Görevin adını yazın...").fill("Test görevi")
    pg.get_by_placeholder("Görev hakkında kısa açıklama...").fill("Otomatik test")
    pg.get_by_role("button", name="Görevi Oluştur").click()
    pg.wait_for_timeout(2500)
    visible_without_reload = pg.get_by_text("Test görevi").count() > 0
    check("Yeni görev, yenilemeden panoda hemen göründü (Realtime yok bu ortamda)", visible_without_reload,
          "görünmedi: ekleme sonrası ne iyimser güncelleme ne de yeniden çekme var, Realtime'a bağımlı")
    pg.reload(wait_until="networkidle")
    try:
        pg.get_by_text("Test görevi").first.wait_for(timeout=8000)
        check("Yenileme sonrası görev panoda görünür (veri DB'ye yazılmış)", True)
    except Exception as e:
        check("Yenileme sonrası görev panoda görünür (veri DB'ye yazılmış)", False, pg.url)
    pg.screenshot(path="shots/13-task-created.png")

    # 7. drag to "Devam Edenler"
    try:
        card = pg.get_by_text("Test görevi").first
        cb = card.bounding_box()
        target = pg.get_by_text("Devam Edenler").first.bounding_box()
        pg.mouse.move(cb["x"] + 20, cb["y"] + 15); pg.mouse.down()
        pg.mouse.move(cb["x"] + 60, cb["y"] + 40, steps=5)
        pg.mouse.move(target["x"] + 120, target["y"] + 200, steps=20)
        pg.mouse.up(); pg.wait_for_timeout(1200)
        pg.screenshot(path="shots/14-after-drag.png")
    except Exception as e:
        print("drag err", e)

    # server-side state via mock REST using the session token
    tok = pg.evaluate("() => { for (const k of Object.keys(localStorage)) { if (k.includes('auth-token')) return JSON.parse(localStorage[k]).access_token } }")
    tasks = rest("tasks?select=*", tok)
    check("Sürükle-bırak: görev 'Devam Edenler'e taşındı (DB)", tasks and tasks[0]["status"] == "Devam Edenler", f"status={tasks[0]['status'] if tasks else None}")
    members = rest("organization_members?select=*", tok)
    check("DB: organization_members 2 kayıt (owner + member)", len(members) == 2, str([m["role"] for m in members]))

    # 8. delete task
    try:
        pg.get_by_text("Test görevi").first.hover()
        pg.locator("[title='Görevi Sil']").first.click(force=True)
        pg.wait_for_timeout(1000)
        check("Görev silindi", len(rest("tasks?select=*", tok)) == 0)
    except Exception as e:
        check("Görev silindi", False, str(e)[:120])
    pg.screenshot(path="shots/15-after-delete.png")

    # 9. second user sees the org/project
    ctx2 = b.new_context(viewport={"width": 1280, "height": 800}); pg2 = ctx2.new_page()
    pg2.on("pageerror", lambda e: page_errors.append("demo: " + str(e)[:200]))
    login(pg2, "demo@demo.com", "12345678")
    try:
        pg2.get_by_text("Demo Projesi").first.wait_for(timeout=8000)
        check("demo@demo.com giriş yapınca davet edildiği projeyi görür", True)
    except Exception:
        check("demo@demo.com giriş yapınca davet edildiği projeyi görür", False, pg2.url)
    pg2.screenshot(path="shots/16-demo-user.png")

    print("\nPAGE ERRORS:", page_errors or "yok")
    b.close()
passed = sum(1 for _, ok, _ in results if ok)
print(f"\nSONUÇ: {passed}/{len(results)} geçti")
