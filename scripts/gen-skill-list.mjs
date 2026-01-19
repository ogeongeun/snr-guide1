// scripts/gen-skill-list.mjs
// ✅ public/images/skills 폴더를 스캔해서
// [
//   { "key": "akilra1", "name": "아킬라1", "image": "/images/skills/akilra1.png" },
//   { "key": "akilra2", "name": "아킬라2", "image": "/images/skills/akilra2.png" },
//   ...
// ]
// 형태로 생성 (heroes.json처럼)

import fs from "fs";
import path from "path";

const projectRoot = process.cwd();
const SKILL_DIR = path.join(projectRoot, "public", "images", "skills");
const OUT_FILE = path.join(projectRoot, "src", "data", "skillImages.json");

const IMG_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function main() {
  if (!fs.existsSync(SKILL_DIR)) {
    console.error("❌ skills 폴더 없음:", SKILL_DIR);
    process.exit(1);
  }

  const files = fs
    .readdirSync(SKILL_DIR)
    .filter((f) => IMG_EXT.has(path.extname(f).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, "en"));

  // heroKey → 한글이름 매핑 (heroes.json 기반)
  let heroNameMap = new Map();
  try {
    const heroesPath = path.join(projectRoot, "src", "data", "heroes.json");
    if (fs.existsSync(heroesPath)) {
      const heroes = JSON.parse(fs.readFileSync(heroesPath, "utf-8"));
      heroNameMap = new Map(
        (Array.isArray(heroes) ? heroes : []).map((h) => [h.key, h.name])
      );
    }
  } catch {
    // heroes.json 파싱 실패해도 진행 (name은 key 기반으로 생성)
  }

  // ✅ 파일명: {heroKey}{num}.png 패턴만 잡음
  // 예: akilra1.png, Yeonhee2.png, Caron1.png
  const list = [];

  for (const f of files) {
    const ext = path.extname(f).toLowerCase();
    const base = path.parse(f).name; // akilra1

    const m = base.match(/^(.+?)(\d+)$/);
    if (!m) continue;

    const heroKey = m[1]; // akilra
    const num = m[2]; // 1

    const heroName = heroNameMap.get(heroKey) || heroKey; // 한글 없으면 key
    const name = `${heroName}${num}`; // "아킬라1" 또는 "akilra1"

    list.push({
      key: base, // ✅ akilra1
      name, // ✅ 아킬라1
      image: `/images/skills/${f}`, // ✅ /images/skills/akilra1.png
    });
  }

  ensureDir(path.dirname(OUT_FILE));
  fs.writeFileSync(OUT_FILE, JSON.stringify(list, null, 2), "utf-8");

  console.log("✅ skillImages.json 생성 완료");
  console.log("스킬 이미지 수:", list.length);
}

main();
