import path from "node:path";
import { Font } from "@react-pdf/renderer";

export const PDF_FONT_FAMILY = "NotoSansPdf";

let registered = false;

function fontPath(fileName: string) {
  return path.join(
    process.cwd(),
    "node_modules",
    "@fontsource",
    "noto-sans",
    "files",
    fileName,
  );
}

export function ensurePdfFontsRegistered() {
  if (registered) return;

  Font.register({
    family: PDF_FONT_FAMILY,
    fonts: [
      {
        src: fontPath("noto-sans-latin-ext-400-normal.woff"),
        fontWeight: 400,
      },
      {
        src: fontPath("noto-sans-latin-ext-400-italic.woff"),
        fontStyle: "italic",
        fontWeight: 400,
      },
      {
        src: fontPath("noto-sans-latin-ext-700-normal.woff"),
        fontWeight: 700,
      },
    ],
  });

  registered = true;
}
