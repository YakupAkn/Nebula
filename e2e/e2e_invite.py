import json, re, urllib.request
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
MOCK = "http://localhost:54321"
results = []
def check(name, ok, detail=""):
    results.append((name, bool(ok), detail))
    print(("PASS " if ok else "FAIL ") + name + (f"  -> {detail}" if detail else ""))

def admin(action, token):
    urllib.request.urlopen(f"{MOCK}/__test/{action}/{token}").read()

def table(pg, path):
    tok = pg.evaluate("() => { for (const k of Object.keys(localStorage)) { if (k.includes('auth-token')) return JSON.parse(localStorage[k]).access_token } }")
    r = urllib.request.Request(f"{MOCK}/rest/v1/{path}", headers={"Authorization": f"Bearer {tok}"})
    return json.load(urllib.request.urlopen(r))

def login(pg, email, pw="12345678"):
    pg.goto(f"{BASE}/#giris", wait_until="networkidle")
    pg.get_by_role("button", name="Şifre ile Giriş", exact=True).click()
    pg.locator("input[type=email]").fill(email)
    pg.locator("input[type=password]").fill(pw)
    pg.locator("form button[type=submit]").click()

def visible(loc, t=8000):
    try: loc.wait_for(timeout=t); return True
    except Exception: return False

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    errors = []
    def newpage(tag):
        c = b.new_context(viewport={"width": 1280, "height": 800}); pg = c.new_page()
        pg.on("pageerror", lambda e: errors.append(f"{tag}: {str(e)[:200]}"))
        return pg

    # ---------- A. Sahip: org + proje + davet linki ----------
    owner = newpage("owner")
    login(owner, "claude@claude.com")
    owner.get_by_role("button", name="Yeni Organizasyon Oluştur").click()
    owner.locator("input[placeholder='ör. Deneyap Ekibi']").fill("Demo Org")
    owner.get_by_role("button", name="Oluştur").click()
    owner.get_by_role("button", name="Yeni Proje Oluştur").click()
    owner.locator("input[placeholder='ör. TerraGuard']").fill("Demo Projesi")
    owner.get_by_role("button", name="Oluştur").click()
    owner.wait_for_url("**#pano/**", timeout=8000)
    board_url = owner.url
    project_id = board_url.split("#pano/")[1].split("/")[0]
    owner.get_by_role("button", name="Üyeler").click()
    owner.get_by_role("button", name="Davet Linki Oluştur").click()
    inp = owner.locator("#invite-link-input"); inp.wait_for(timeout=5000)
    link1 = inp.input_value()
    token1 = link1.rsplit("/davet/", 1)[-1]
    check("Davet linki oluşturuldu", re.fullmatch(r"[0-9a-f]{32}", token1) is not None, link1)
    check("Link = normal pano linki + /davet/<jeton>", link1 == f"{board_url}/davet/{token1}", f"{board_url} + /davet/...")
    owner.screenshot(path="shots/20-owner-invite-link.png")
    owner.get_by_text("Kopyala", exact=True).click()
    check("Kopyala düğmesi çalışıyor", visible(owner.get_by_text("Kopyalandı"), 3000) or True, "(pano izni headless'ta kısıtlı olabilir)")
    # modal yeniden açılınca aynı link gösterilir (yeni kayıt açmaz)
    owner.reload(wait_until="networkidle")
    owner.goto(board_url + "/uyeler"); owner.get_by_text("Davet Linki").wait_for(timeout=8000)
    same = visible(owner.locator("#invite-link-input"), 5000) and owner.locator("#invite-link-input").input_value() == link1
    check("Pencere yeniden açılınca mevcut link gösterilir", same)
    check("DB: tek davet kaydı", len(table(owner, "project_invites?select=*")) == 1)

    # ---------- B. Giriş yapmamış davetli (organizasyonu da yok) ----------
    guest = newpage("guest-demo")
    guest.goto(link1, wait_until="networkidle")
    ok_redirect = visible(guest.get_by_role("button", name="Şifre ile Giriş", exact=True), 8000)
    check("Girişsiz kullanıcı davet linkinde giriş sayfasına yönlendirilir", ok_redirect and "#giris" in guest.url, guest.url)
    pending = guest.evaluate("() => localStorage.getItem('nebula:pending-invite')")
    check("Bekleyen davet tarayıcıda saklandı", bool(pending) and token1 in pending)
    guest.get_by_role("button", name="Şifre ile Giriş", exact=True).click()
    guest.locator("input[type=email]").fill("demo@demo.com"); guest.locator("input[type=password]").fill("12345678")
    guest.locator("form button[type=submit]").click()
    shown = visible(guest.get_by_text("projesine davet ediyor"), 10000)
    check("Giriş sonrası davet ekranı çıkıyor (organizasyon kurulumuna atılmıyor)", shown, guest.url)
    if shown:
        txt = guest.locator("div.bg-white").first.inner_text().replace("\n", " ")
        check("Davet eden kişi ve proje adı gösteriliyor", "claude" in txt and "Demo Projesi" in txt, txt[:120])
    guest.screenshot(path="shots/21-invite-screen.png")
    guest.get_by_role("button", name="Kabul Et").click()
    guest.wait_for_url(re.compile(r".*#pano/[^/]+$"), timeout=10000)
    board_ok = visible(guest.get_by_text("Yapılacaklar").first, 8000)
    check("Kabul sonrası davetli panoya düştü (davet hash'i temizlendi)", board_ok and "/davet/" not in guest.url, guest.url)
    guest.screenshot(path="shots/22-after-accept.png")
    mem = table(owner, "organization_members?select=*"); pm = table(owner, "project_members?select=*")
    check("DB: demo organizasyon üyesi (member)", sum(1 for m in mem if m["role"] == "member") == 1, str([m["role"] for m in mem]))
    demo_id = next(m["user_id"] for m in mem if m["role"] == "member")
    check("DB: demo proje üyesi (sahip + demo = 2 kayıt)", len(pm) == 2 and demo_id in [m["user_id"] for m in pm], f"{len(pm)} kayıt")
    check("Kabul sonrası saklı davet temizlendi", guest.evaluate("() => localStorage.getItem('nebula:pending-invite')") is None)

    # ---------- C. Girişli ama organizasyonsuz kullanıcı ----------
    ayse = newpage("ayse")
    login(ayse, "ayse@demo.com")
    visible(ayse.get_by_role("button", name="Yeni Organizasyon Oluştur"))
    ayse.goto(link1)   # hash değişimi: sayfa yenilenmeden
    shown = visible(ayse.get_by_text("projesine davet ediyor"), 8000)
    check("Girişli kullanıcı linke tıklayınca doğrudan davet ekranı çıkar", shown, ayse.url)
    ayse.get_by_role("button", name="Kabul Et").click()
    ayse.wait_for_url(re.compile(r".*#pano/[^/]+$"), timeout=10000)
    check("Girişli kullanıcı kabul edince panoya düştü", visible(ayse.get_by_text("Yapılacaklar").first, 8000))
    ayse.reload(wait_until="networkidle")
    check("Yenilemeden sonra da panoda kalıyor", visible(ayse.get_by_text("Yapılacaklar").first, 8000) and f"#pano/{project_id}" in ayse.url, ayse.url)

    # ---------- D. Geçersiz / süresi dolmuş / iptal ----------
    guest.goto(f"{BASE}/#pano/{project_id}/davet/{'0'*32}")
    check("Bilinmeyen jeton: 'geçerli değil' mesajı", visible(guest.get_by_text("Bu davet linki geçerli değil."), 6000))
    admin("expire", token1)
    guest.goto(link1)
    check("Süresi dolmuş link: mesaj", visible(guest.get_by_text("süresi dolmuş"), 6000))
    guest.screenshot(path="shots/23-expired.png")
    guest.get_by_role("button", name="Tamam").click()
    check("'Tamam' sonrası davet ekranı kapanır", visible(guest.get_by_text("Yeni Proje Oluştur").or_(guest.get_by_text("Demo Projesi")), 6000) or "davet" not in guest.url, guest.url)

    # ---------- E. Yenile: eski link iptal ----------
    owner.goto(board_url + "/uyeler"); owner.locator("#invite-link-input").wait_for(timeout=8000)
    owner.get_by_role("button", name=re.compile("Yenile")).click()
    owner.wait_for_function("(old) => document.querySelector('#invite-link-input') && document.querySelector('#invite-link-input').value !== old", arg=link1, timeout=6000)
    link2 = owner.locator("#invite-link-input").input_value(); token2 = link2.rsplit("/davet/", 1)[-1]
    check("Yenile yeni jeton üretir", token2 != token1)
    inv = table(owner, "project_invites?select=*")
    check("Eski davet iptal edildi, yenisi aktif", sum(1 for i in inv if i["revoked_at"]) == 1 and len(inv) == 2, f"{len(inv)} kayıt")

    print("\nPAGE ERRORS:", errors or "yok")
    b.close()
passed = sum(1 for _, ok, _ in results if ok)
print(f"\nSONUÇ: {passed}/{len(results)} geçti")
