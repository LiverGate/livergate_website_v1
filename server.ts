import express from "express";
import compression from "compression";
import helmet from "helmet";
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
            // 'unsafe-inline' is required for the motion library's inline styles.
            "style-src": ["'self'", "'unsafe-inline'"],
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
