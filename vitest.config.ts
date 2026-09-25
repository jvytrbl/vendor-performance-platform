import path from "path";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "."),
        },
    },
    test: {
        environment: "node",
        // tests/ is Playwright's testDir (own runner, own test() implementation) —
        // Vitest's default excludes don't cover it, so without this it tries to
        // collect .spec.ts files there too and fails on Playwright's test().
        exclude: [...configDefaults.exclude, "tests/**"],
    },
})
