// scripts/gen-pet-list.mjs
// ✅ public/images/pet 폴더 스캔해서
// [
//   { "key": "dello", "name": "dello", "image": "/images/pet/dello.png" },
//   ...
// ]
// 형태로 생성

import fs from "fs";
import path from "path";

const projectRoot = process.cwd();
const PET_DIR = path.join(projectRoot, "public", "images", "pet");
const OUT_FILE = path.join(projectRoot, "src", "data", "petImages.json");

const IMG_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function main() {
  if (!fs.existsSync(PET_DIR)) {
    console.error("❌ pet 폴더 없음:", PET_DIR);
    process.exit(1);
  }

  const files = fs
    .readdirSync(PET_DIR)
    .filter((f) => IMG_EXT.has(path.extname(f).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, "en"));

  const list = files.map((f) => {
    const base = path.parse(f).name; // dello
    return {
      key: base, // ✅ dello
      name: base, // ✅ 기본은 파일명 (원하면 나중에 한글로 수정)
      image: `/images/pet/${f}`, // ✅ /images/pet/dello.png
    };
  });

  ensureDir(path.dirname(OUT_FILE));
  fs.writeFileSync(OUT_FILE, JSON.stringify(list, null, 2), "utf-8");

  console.log("✅ petImages.json 생성 완료");
  console.log("펫 이미지 수:", list.length);
}

main();
