import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Thư viện của bên thứ ba đặt sẵn trong public/, không sửa nên không lint:
    // file bundle đã minify, lint sẽ ra hàng trăm cảnh báo vô nghĩa.
    "public/vendor/**",
  ]),
]);

export default eslintConfig;
