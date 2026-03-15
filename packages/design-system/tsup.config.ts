import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/table.ts", "src/editor.ts"],
  format: ["cjs", "esm"],
  external: [
    "@tanstack/react-table",
    "@tiptap/react",
    "@tiptap/starter-kit",
    "@tiptap/extension-placeholder",
  ],
});
