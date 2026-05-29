/**
 * dotenv preload. Import this as the FIRST line of any entry script so that
 * `.env.local` lands in `process.env` *before* any other module-init code
 * captures it (e.g. `lib/sources/registry.ts` freezing `REPORT_LOCALE`,
 * `lib/utils.ts` reading `REPORT_TZ`, etc.).
 *
 * Usage in a script:
 *   import "./_env";          // must be the first import
 *   import fs from "node:fs"; // anything else
 */
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

// --- Proxy support for Node.js fetch / undici (used by non-RSS sources) ---
import { ProxyAgent, setGlobalDispatcher } from "undici";
const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
if (proxyUrl) {
  try {
    setGlobalDispatcher(new ProxyAgent({ uri: proxyUrl }));
  } catch (_) {
    // silently ignore invalid proxy config
  }
}