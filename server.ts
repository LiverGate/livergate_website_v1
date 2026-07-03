import express from "express";
import compression from "compression";
import helmet from "helmet";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProd = process.env.NODE_ENV === "production";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Don't advertise the framework.
  app.disable("x-powered-by");

  // Compress responses (Cloud Run / Google Frontend does not gzip origin output).
  app.use(compression());

  // Security headers. CSP only in production: the Vite dev server needs inline
  // scripts / eval / an HMR websocket that a strict CSP would block.
  if (isProd) {
    app.use(
      helmet({
        contentSecurityPolicy: {
          useDefaults: true,
          directives: {
            // Only origins the page actually loads: self + the two image CDNs.
            "img-src": [
              "'self'",
              "data:",
              "https://res.cloudinary.com",
              "https://qr-official.line.me",
            ],
            // 'unsafe-inline' (styles) is required for the motion library.
            // Google Fonts is used by the corporate site (site/).
            "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            "font-src": ["'self'", "https://fonts.gstatic.com"],
            // TODO: corporate pages (site/*.html) still use inline <script>;
            // extract them to external files, then drop 'unsafe-inline' here.
            "script-src": ["'self'", "'unsafe-inline'"],
            "frame-ancestors": ["'none'"],
          },
        },
        // Cloudinary / LINE images are cross-origin; COEP would block them.
        crossOriginEmbedderPolicy: false,
        // 180 days, no preload yet (opt into preload deliberately later).
        hsts: { maxAge: 15552000, includeSubDomains: true },
      })
    );
  }

  // API routes go here
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // ---- お問い合わせ / 採用エントリー受付 API ------------------------------
  // 保存先: Cloud Run (K_SERVICE が立つ) では Firestore、ローカル開発ではメモリ。
  // 管理系 (GET/DELETE) は ADMIN_TOKEN による Basic 認証必須。
  app.use("/api", express.json({ limit: "64kb" }));

  type Inquiry = {
    id: string;
    kind: "contact" | "apply";
    date: string;
    data: Record<string, string>;
  };
  const useFirestore = Boolean(process.env.K_SERVICE || process.env.USE_FIRESTORE);
  const memStore: Inquiry[] = [];
  let firestore: InstanceType<typeof import("@google-cloud/firestore").Firestore> | null = null;
  async function inquiriesCol() {
    if (!firestore) {
      const { Firestore } = await import("@google-cloud/firestore");
      firestore = new Firestore();
    }
    return firestore.collection("inquiries");
  }
  async function saveInquiry(doc: Inquiry): Promise<void> {
    if (!useFirestore) {
      memStore.unshift(doc);
      memStore.splice(500); // ローカルは直近500件まで
      return;
    }
    await (await inquiriesCol()).doc(doc.id).set(doc);
  }
  async function listInquiries(): Promise<Inquiry[]> {
    if (!useFirestore) return memStore;
    const snap = await (await inquiriesCol()).orderBy("date", "desc").limit(300).get();
    return snap.docs.map((d) => d.data() as Inquiry);
  }
  async function deleteInquiry(id: string): Promise<void> {
    if (!useFirestore) {
      const i = memStore.findIndex((x) => x.id === id);
      if (i >= 0) memStore.splice(i, 1);
      return;
    }
    await (await inquiriesCol()).doc(id).delete();
  }
  function adminAuthorized(req: express.Request): boolean {
    const token = process.env.ADMIN_TOKEN;
    if (!token) return false;
    const expected = "Basic " + Buffer.from(`admin:${token}`).toString("base64");
    const got = req.headers.authorization ?? "";
    const a = crypto.createHash("sha256").update(got).digest();
    const b = crypto.createHash("sha256").update(expected).digest();
    return crypto.timingSafeEqual(a, b);
  }
  function requireAdmin(req: express.Request, res: express.Response): boolean {
    if (!process.env.ADMIN_TOKEN) {
      res.status(503).json({ error: "admin_disabled" });
      return false;
    }
    if (!adminAuthorized(req)) {
      res.status(401).json({ error: "unauthorized" });
      return false;
    }
    return true;
  }

  app.post("/api/inquiries", async (req, res) => {
    const { kind, data: raw } = (req.body ?? {}) as { kind?: unknown; data?: unknown };
    if ((kind !== "contact" && kind !== "apply") || typeof raw !== "object" || raw === null) {
      res.status(400).json({ error: "bad_request" });
      return;
    }
    const data: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof v !== "string" || k.length > 40) continue;
      data[k] = v.slice(0, 4000);
      if (Object.keys(data).length >= 24) break;
    }
    const doc: Inquiry = {
      id: `iq_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
      kind,
      date: new Date().toISOString(),
      data,
    };
    try {
      await saveInquiry(doc);
      res.status(201).json({ ok: true });
    } catch (err) {
      console.error("inquiry save failed:", err);
      res.status(503).json({ error: "unavailable" });
    }
  });

  app.get("/api/inquiries", async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      res.json({ items: await listInquiries() });
    } catch (err) {
      console.error("inquiry list failed:", err);
      res.status(503).json({ error: "unavailable" });
    }
  });

  app.delete("/api/inquiries/:id", async (req, res) => {
    if (!requireAdmin(req, res)) return;
    const id = req.params.id;
    if (!/^iq_[A-Za-z0-9_]+$/.test(id)) {
      res.status(400).json({ error: "bad_request" });
      return;
    }
    try {
      await deleteInquiry(id);
      res.json({ ok: true });
    } catch (err) {
      console.error("inquiry delete failed:", err);
      res.status(503).json({ error: "unavailable" });
    }
  });

  // OpenGate corporate site (static) at the root: /, *.html and its assets.
  // Mounted before the app assets/routes so "/" serves the corporate top page;
  // the Kaygyoz app lives at /kaygyoz (+ /services, /cases, /contact).
  const siteDir = path.join(__dirname, "site");
  app.use(
    express.static(siteDir, {
      redirect: false,
      setHeaders: (res, filePath) => {
        res.setHeader(
          "Cache-Control",
          filePath.endsWith(".html") ? "no-cache" : "public, max-age=3600"
        );
      },
    })
  );

  if (isProd) {
    const distDir = path.join(__dirname, "dist");

    // Serve static assets. Content-hashed files under /assets are safe to cache
    // forever; everything else (incl. index.html) must always revalidate.
    app.use(
      express.static(distDir, {
        index: false,
        // Don't 301 /services -> /services/; the catch-all serves the
        // prerendered file directly so canonical URLs stay slash-free.
        redirect: false,
        setHeaders: (res, filePath) => {
          if (filePath.includes(`${path.sep}assets${path.sep}`)) {
            res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          } else {
            res.setHeader("Cache-Control", "no-cache");
          }
        },
      })
    );

    // SPA fallback. A request that looks like a file (has an extension) but
    // wasn't matched by express.static is a genuine 404 — returning index.html
    // would create a soft-404 and serve HTML where JS/CSS was expected.
    app.get("*", (req, res) => {
      if (path.extname(req.path)) {
        res.status(404).type("txt").send("Not Found");
        return;
      }
      res.setHeader("Cache-Control", "no-cache");
      // Serve the prerendered HTML for this route (dist/<route>/index.html) if it
      // exists; otherwise fall back to the home shell. sendFile with `root`
      // rejects path traversal, so a bad path safely lands on the fallback.
      res.sendFile(path.join(req.path, "index.html"), { root: distDir }, (err) => {
        if (err) {
          res.sendFile(path.join(distDir, "index.html"));
        }
      });
    });
  } else {
    // Vite middleware for development (imported lazily so the build tool is
    // never loaded into the production process).
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  // Terminal 404 for anything not handled above (e.g. non-GET methods).
  app.use((_req, res) => {
    res.status(404).type("txt").send("Not Found");
  });

  // Error handler — log server-side, never leak details to the client.
  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      console.error(err);
      res.status(500).type("txt").send("Internal Server Error");
    }
  );

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
