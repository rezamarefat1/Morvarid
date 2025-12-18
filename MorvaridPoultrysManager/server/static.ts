import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Handle __dirname in both ESM and CJS contexts
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "..", "dist", "public"); // Navigate up from server dir to project root, then to dist/public

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Security: Only serve static files from distPath, and use compression
  app.use(express.static(distPath, {
    // Prevent serving sensitive files
    fallthrough: false, // Don't continue to next route if file not found
    setHeaders: (res, path) => {
      // Prevent content type sniffing
      res.setHeader('X-Content-Type-Options', 'nosniff');

      // Prevent MIME-type sniffing
      if (path.endsWith('.html') || path.endsWith('.htm')) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
      } else if (path.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      } else if (path.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
      }
    }
  }));

  // Security: Ensure sensitive files are not accessible
  app.get(/^\/(\.env|\.git|package\.json|package-lock\.json|.*\.ts|.*\.tsx|.*\.js.map|.*\.ts.map|.*\.cjs|.*\.mjs|.*\.env.*)/, (_req, res) => {
    res.status(404).send('Not found');
  });

  // fall through to index.html if the file doesn't exist (for SPA routing)
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"), {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
      }
    });
  });
}
