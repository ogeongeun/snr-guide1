import fs from "fs";
import path from "path";

const projectRoot = process.cwd();
const HERO_DIR = path.join(projectRoot, "public", "images", "heroes");
const OUT_FILE = path.join(projectRoot, "src", "data", "heroes.json");

const IMG_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function main() {
  if (!fs.existsSync(HERO_DIR)) {
    console.error("❌ heroes 폴더 없음:", HERO_DIR);
    process.exit(1);
  }

  const files = fs
    .readdirSync(HERO_DIR)
    .filter((f) => IMG_EXT.has(path.extname(f).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, "en"));

  const list = files.map((f) => {
    const base = path.parse(f).name;
    return {
      key: base,              // evan
      name: "",               // ⬅ 한글 이름은 여기 나중에 채움
      image: `/images/heroes/${f}`
    };
  });

  ensureDir(path.dirname(OUT_FILE));
  fs.writeFileSync(OUT_FILE, JSON.stringify(list, null, 2), "utf-8");

  console.log("✅ heroes.json 생성 완료");
  console.log("영웅 수:", list.length);
}

main();
