// scripts/gen-ring-list.mjs
// ✅ public/images/ring 폴더를 스캔해서
// [
//   { "key": "4bu", "name": "4bu", "image": "/images/ring/4bu.png" },
//   ...
// ]
// 형태의 JSON 생성

import fs from "fs";
import path from "path";

const projectRoot = process.cwd();
const RING_DIR = path.join(projectRoot, "public", "images", "ring");
const OUT_FILE = path.join(projectRoot, "src", "data", "ringImages.json");

const IMG_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function main() {
  if (!fs.existsSync(RING_DIR)) {
    console.error("❌ ring 폴더 없음:", RING_DIR);
    process.exit(1);
  }

  const files = fs
    .readdirSync(RING_DIR)
    .filter((f) => IMG_EXT.has(path.extname(f).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, "en"));

  const list = [];

  for (const f of files) {
    const base = path.parse(f).name; // 4bu
    list.push({
      key: base,                  // "4bu"
      name: base,                 // "4bu" (추후 매핑 가능)
      image: `/images/ring/${f}`, // "/images/ring/4bu.png"
    });
  }

  ensureDir(path.dirname(OUT_FILE));
  fs.writeFileSync(OUT_FILE, JSON.stringify(list, null, 2), "utf-8");

  console.log("✅ ringImages.json 생성 완료");
  console.log("이미지 수:", list.length);
}

main();
