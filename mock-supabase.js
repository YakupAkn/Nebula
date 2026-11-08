// Minimal in-memory Supabase stand-in (GoTrue + PostgREST subset) for UI testing.
// No RLS, no realtime. Zero dependencies.
const http = require("http");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 54321);
const uuid = () => crypto.randomUUID();

const users = [
  { id: uuid(), email: "claude@claude.com", password: "12345678" },
  { id: uuid(), email: "demo@demo.com", password: "12345678" },
  { id: uuid(), email: "ayse@demo.com", password: "12345678" },
];
const db = {
  organizations: [],
  organization_members: [],
  projects: [],
  project_members: [],
  profiles: [],
  tasks: [],
  project_invites: [],
};
let taskSeq = 1;
const log = [];

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
function makeSession(u) {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const token = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({
    sub: u.id, email: u.email, role: "authenticated", aud: "authenticated", exp,
  })}.mock`;
  return {
    access_token: token, token_type: "bearer", expires_in: 3600, expires_at: exp,
    refresh_token: "r-" + u.id, user: publicUser(u),
  };
}
const publicUser = (u) => ({
  id: u.id, aud: "authenticated", role: "authenticated", email: u.email,
  email_confirmed_at: new Date().toISOString(), app_metadata: {}, user_metadata: {},
  created_at: new Date().toISOString(),
});
const userFromAuth = (req) => {
  const t = (req.headers.authorization || "").replace(/^Bearer /, "");
  try {
    const p = JSON.parse(Buffer.from(t.split(".")[1], "base64url").toString());
    return users.find((u) => u.id === p.sub);
  } catch { return null; }
};

function applyFilters(rows, params) {
  for (const [k, v] of params) {
    if (["select", "order", "limit", "offset", "on_conflict", "columns"].includes(k)) continue;
    const m = /^(eq|neq|in|is|ilike|gt|lt|gte|lte)\.(.*)$/.exec(v);
    if (!m) continue;
    const [, op, val] = m;
    rows = rows.filter((r) => {
      const cell = r[k];
      if (op === "eq") return String(cell) === val;
      if (op === "neq") return String(cell) !== val;
      if (op === "in") return val.replace(/^\(|\)$/g, "").split(",").map((s) => s.replace(/^"|"$/g, "")).includes(String(cell));
      if (op === "is") return val === "null" ? cell == null : String(cell) === val;
      if (op === "ilike") return String(cell).toLowerCase() === val.replace(/%/g, "").toLowerCase();
      if (op === "gt") return cell > val; if (op === "lt") return cell < val;
      if (op === "gte") return cell >= val; if (op === "lte") return cell <= val;
      return true;
    });
  }
  const order = params.get("order");
  if (order) {
    const [col, dir] = order.split(".");
    rows = [...rows].sort((a, b) => (a[col] > b[col] ? 1 : a[col] < b[col] ? -1 : 0) * (dir === "desc" ? -1 : 1));
  }
  const limit = params.get("limit");
  if (limit) rows = rows.slice(0, Number(limit));
  return rows;
}

function send(res, status, body, extra = {}) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
    "Access-Control-Expose-Headers": "Content-Range",
    ...extra,
  });
  res.end(body === undefined ? "" : JSON.stringify(body));
}

http.createServer((req, res) => {
  let raw = "";
  req.on("data", (c) => (raw += c));
  req.on("end", () => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const path = url.pathname;
    let body = {};
    try { body = raw ? JSON.parse(raw) : {}; } catch {}
    if (req.method === "OPTIONS") return send(res, 204);
    const adm = /^\/__test\/(expire|revoke)\/(\w+)$/.exec(path);
    if (adm) {
      const inv = db.project_invites.find((i) => i.token === adm[2]);
      if (!inv) return send(res, 404, { error: "no such invite" });
      if (adm[1] === "expire") inv.expires_at = new Date(Date.now() - 1000).toISOString();
      else inv.revoked_at = new Date().toISOString();
      return send(res, 200, { ok: true });
    }
    if (!path.startsWith("/auth") && !path.startsWith("/rest")) {
      return send(res, 404, { error: "not found" });
    }
    log.push(`${req.method} ${path}${url.search.slice(0, 80)}`);

    // ---- Auth ----
    if (path === "/auth/v1/token") {
      const grant = url.searchParams.get("grant_type");
      if (grant === "password") {
        const u = users.find((x) => x.email === body.email && x.password === body.password);
        if (!u) return send(res, 400, { error: "invalid_grant", error_description: "Invalid login credentials", code: 400, msg: "Invalid login credentials" });
        return send(res, 200, makeSession(u));
      }
      if (grant === "refresh_token") {
        const u = users.find((x) => "r-" + x.id === body.refresh_token);
        return u ? send(res, 200, makeSession(u)) : send(res, 400, { error: "invalid_grant" });
      }
    }
    if (path === "/auth/v1/user") {
      const u = userFromAuth(req);
      return u ? send(res, 200, publicUser(u)) : send(res, 401, { msg: "invalid JWT" });
    }
    if (path === "/auth/v1/logout") return send(res, 204);
    if (path === "/auth/v1/settings") return send(res, 200, { external: {}, disable_signup: false });

    // ---- RPC ----
    const rpc = /^\/rest\/v1\/rpc\/(\w+)$/.exec(path);
    if (rpc) {
      if (rpc[1] === "find_user_by_email") {
        const e = String(body.search_email || "").toLowerCase();
        return send(res, 200, users.filter((u) => u.email.toLowerCase() === e).map((u) => ({ id: u.id, email: u.email })));
      }
      if (rpc[1] === "get_users_by_ids") {
        const ids = body.user_ids || [];
        return send(res, 200, users.filter((u) => ids.includes(u.id)).map((u) => ({ id: u.id, email: u.email })));
      }
      if (rpc[1] === "get_invite_info" || rpc[1] === "accept_invite") {
        const me = userFromAuth(req);
        if (!me) return send(res, 401, { code: "28000", message: "not_authenticated" });
        const inv = db.project_invites.find((i) => i.token === body.invite_token);
        const status = !inv ? "not_found" : inv.revoked_at ? "revoked" : new Date(inv.expires_at) <= new Date() ? "expired" : "valid";
        if (rpc[1] === "get_invite_info") {
          if (status !== "valid") return send(res, 200, { status });
          const proj = db.projects.find((x) => x.id === inv.project_id);
          const org = db.organizations.find((x) => x.id === inv.organization_id);
          const by = users.find((x) => x.id === inv.created_by);
          const prof = db.profiles.find((x) => x.id === inv.created_by);
          return send(res, 200, {
            status, project_id: inv.project_id, project_name: proj && proj.name,
            organization_id: inv.organization_id, organization_name: org && org.name,
            inviter_name: (prof && prof.full_name) || (by && by.email.split("@")[0]), inviter_email: by && by.email,
            already_member: db.organization_members.some((m) => m.organization_id === inv.organization_id && m.user_id === me.id),
          });
        }
        if (status !== "valid") return send(res, 400, { code: "P0001", message: "invite_invalid" });
        if (!db.organization_members.some((m) => m.organization_id === inv.organization_id && m.user_id === me.id))
          db.organization_members.push({ id: uuid(), organization_id: inv.organization_id, user_id: me.id, role: "member", created_at: new Date().toISOString() });
        if (!db.project_members.some((m) => m.project_id === inv.project_id && m.user_id === me.id))
          db.project_members.push({ id: uuid(), project_id: inv.project_id, user_id: me.id, created_at: new Date().toISOString() });
        return send(res, 200, { project_id: inv.project_id, organization_id: inv.organization_id });
      }
      return send(res, 404, { message: "rpc not mocked: " + rpc[1] });
    }

    // ---- REST ----
    const t = /^\/rest\/v1\/(\w+)$/.exec(path);
    if (!t) return send(res, 404, { message: "not found" });
    const table = t[1];
    if (!db[table]) return send(res, 404, { code: "42P01", message: `relation "${table}" does not exist` });
    const wantObject = /vnd\.pgrst\.object/.test(req.headers.accept || "");
    const prefer = req.headers.prefer || "";
    const asResult = (rows) => {
      if (wantObject) {
        return rows.length === 1
          ? send(res, 200, rows[0])
          : send(res, 406, { code: "PGRST116", message: "JSON object requested, multiple (or no) rows returned", details: `The result contains ${rows.length} rows` });
      }
      return send(res, 200, rows);
    };

    if (req.method === "GET") return asResult(applyFilters(db[table], url.searchParams));

    if (req.method === "POST") {
      const items = Array.isArray(body) ? body : [body];
      const out = [];
      const merge = /merge-duplicates/.test(prefer);
      for (const it of items) {
        const row = { ...it };
        if (merge && row.id != null) {
          const ex = db[table].find((r) => String(r.id) === String(row.id));
          if (ex) { Object.assign(ex, row); out.push(ex); continue; }
        }
        if (table === "project_invites") {
          const me = userFromAuth(req);
          row.token = crypto.randomBytes(16).toString("hex");
          row.created_by = me && me.id;
          row.expires_at = new Date(Date.now() + 7 * 864e5).toISOString();
          row.revoked_at = null;
        }
        if (row.id == null) row.id = table === "tasks" ? taskSeq++ : uuid();
        row.created_at = row.created_at || new Date().toISOString();
        db[table].push(row);
        out.push(row);
      }
      if (/return=representation/.test(prefer)) return wantObject ? asResult(out) : send(res, 201, out);
      return send(res, 201);
    }

    if (req.method === "PATCH") {
      const rows = applyFilters(db[table], url.searchParams);
      rows.forEach((r) => Object.assign(r, body));
      return /return=representation/.test(prefer) ? asResult(rows) : send(res, 204);
    }

    if (req.method === "DELETE") {
      const rows = new Set(applyFilters(db[table], url.searchParams));
      db[table] = db[table].filter((r) => !rows.has(r));
      return send(res, 204);
    }
    send(res, 405, { message: "method not allowed" });
  });
}).listen(PORT, () => console.log(`mock supabase on :${PORT}`));

process.on("SIGTERM", () => {
  require("fs").writeFileSync(
    process.env.MOCK_LOG || "/home/claude/nebula-v2/e2e/mock-requests.log",
    log.join("\n") + "\n\n" + JSON.stringify(db, (k, v) => (k === "password" ? undefined : v), 2)
  );
  process.exit(0);
});
