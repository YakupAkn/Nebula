import { useMemo, useSyncExternalStore } from "react";

/**
 * Ana sayfa (/) için hash tabanlı adresler.
 *
 *   /                          landing (giriş yapılmamışsa) ya da son projenin panosu
 *   /#giris                    giriş
 *   /#organizasyon             organizasyon oluşturma
 *   /#projeler                 proje seçimi
 *   /#pano/<proje>             pano
 *   /#pano/<proje>/yeni-gorev  yeni görev penceresi
 *   /#pano/<proje>/uyeler      üyeler penceresi
 *   /#pano/<proje>/gorev/<id>  görev detayı
 *
 * Supabase giriş dönüşündeki parçalar (#access_token=... gibi "=" içerenler)
 * rota sayılmaz, olduğu gibi bırakılır.
 */

export type RouteView = "ana" | "giris" | "organizasyon" | "projeler" | "pano";
export type RouteModal = "yeni-gorev" | "uyeler";

export interface Route {
  view: RouteView;
  projectId: string | null;
  taskId: string | null;
  modal: RouteModal | null;
}

const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const ROUTE_EVENT = "nebula:hashroute";
const EMPTY: Route = { view: "ana", projectId: null, taskId: null, modal: null };

function safeDecode(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return undefined;
  }
}

export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#\/?/, "");
  if (!raw || raw.includes("=")) return EMPTY;

  const [head, a, b, c] = raw.split("/").map(safeDecode);

  switch (head) {
    case "giris":
      return { ...EMPTY, view: "giris" };
    case "organizasyon":
      return { ...EMPTY, view: "organizasyon" };
    case "projeler":
      return { ...EMPTY, view: "projeler" };
    case "pano": {
      const projectId = a && ID_PATTERN.test(a) ? a : null;
      let modal: RouteModal | null = null;
      let taskId: string | null = null;
      if (projectId) {
        if (b === "yeni-gorev" || b === "uyeler") modal = b;
        else if (b === "gorev" && c && ID_PATTERN.test(c)) taskId = c;
      }
      return { view: "pano", projectId, taskId, modal };
    }
    default:
      return EMPTY;
  }
}

export type RouteTarget = Partial<Route> & Pick<Route, "view">;

export function buildHash(route: RouteTarget): string {
  switch (route.view) {
    case "giris":
      return "#giris";
    case "organizasyon":
      return "#organizasyon";
    case "projeler":
      return "#projeler";
    case "pano": {
      if (!route.projectId) return "#pano";
      let hash = `#pano/${encodeURIComponent(route.projectId)}`;
      if (route.modal) hash += `/${route.modal}`;
      else if (route.taskId) hash += `/gorev/${encodeURIComponent(route.taskId)}`;
      return hash;
    }
    default:
      return "";
  }
}

// "Pencere" açarken geçmişe yeni kayıt ekleriz, kapatırken geri döneriz.
// Böylece geri tuşu pencereyi kapatır ve geçmiş şişmez.
let overlayPushed = false;

function subscribe(callback: () => void) {
  const onPop = () => {
    overlayPushed = false;
    callback();
  };
  window.addEventListener("hashchange", callback);
  window.addEventListener("popstate", onPop);
  window.addEventListener(ROUTE_EVENT, callback);
  return () => {
    window.removeEventListener("hashchange", callback);
    window.removeEventListener("popstate", onPop);
    window.removeEventListener(ROUTE_EVENT, callback);
  };
}

const getSnapshot = () => window.location.hash;
const getServerSnapshot = () => "";

export function useHashRoute(): Route {
  const hash = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return useMemo(() => parseHash(hash), [hash]);
}

export function navigate(
  target: RouteTarget,
  options: { replace?: boolean; overlay?: boolean } = {}
) {
  const nextHash = buildHash(target);
  if (nextHash === window.location.hash) return;

  const url = window.location.pathname + window.location.search + nextHash;

  if (options.replace) {
    window.history.replaceState(null, "", url);
  } else {
    window.history.pushState(null, "", url);
    overlayPushed = !!options.overlay;
  }
  window.dispatchEvent(new Event(ROUTE_EVENT));
}

/** Pencereyi kapat: biz açtıysak geri dön, değilse (yenileme/paylaşılan link) hash'i temizle. */
export function closeOverlay(route: Route) {
  if (overlayPushed) {
    overlayPushed = false;
    window.history.back();
    return;
  }
  navigate(
    { view: route.view, projectId: route.projectId, taskId: null, modal: null },
    { replace: true }
  );
}

const LAST_PROJECT_KEY = "nebula:last-project";

export function readLastProject(): string | null {
  try {
    const value = window.localStorage.getItem(LAST_PROJECT_KEY);
    return value && ID_PATTERN.test(value) ? value : null;
  } catch {
    return null;
  }
}

export function writeLastProject(projectId: string | null) {
  try {
    if (projectId) window.localStorage.setItem(LAST_PROJECT_KEY, projectId);
    else window.localStorage.removeItem(LAST_PROJECT_KEY);
  } catch {
    /* localStorage kapalı olabilir, sorun değil */
  }
}

/** Supabase'in hata dönüşünü (?error=... ya da #error=...) okunur Türkçe mesaja çevirir. */
export function readAuthErrorFromUrl(): string | null {
  const search = new URLSearchParams(window.location.search);
  const frag = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const error = search.get("error") ?? frag.get("error");
  if (!error) return null;

  const code = search.get("error_code") ?? frag.get("error_code") ?? error;
  if (code === "otp_expired") return "Giriş bağlantısının süresi dolmuş. Yeni bir bağlantı iste.";
  if (code === "access_denied") return "Giriş iptal edildi.";
  return "Giriş tamamlanamadı. Tekrar dene ya da e-posta ile giriş yap.";
}

/** Adres çubuğundaki hata parçalarını temizler, rota hash'ini korur. */
export function clearAuthErrorFromUrl(hash: string) {
  window.history.replaceState(null, "", window.location.pathname + hash);
  window.dispatchEvent(new Event(ROUTE_EVENT));
}
