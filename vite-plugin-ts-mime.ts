import type { Plugin } from "vite";

/**
 * Dev-only: sirv/mime maps `.ts` → video/mp2t (MPEG transport stream).
 * Download managers (IDM, etc.) then offer to "download video" for JS modules.
 * Force JavaScript MIME on TypeScript module requests.
 */
export function tsMimeFixPlugin(): Plugin {
  return {
    name: "mgo-ts-mime-fix",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url ?? "").split("?")[0] ?? "";
        if (!/\.[cm]?tsx?$/i.test(path)) {
          next();
          return;
        }

        const setHeader = res.setHeader.bind(res);
        res.setHeader = (name, value, ...rest) => {
          if (String(name).toLowerCase() === "content-type") {
            return setHeader(
              name,
              "text/javascript; charset=utf-8",
              ...rest,
            );
          }
          return setHeader(name, value, ...rest);
        };

        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("Content-Disposition", "inline");

        next();
      });
    },
  };
}
