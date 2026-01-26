// scripts/addCounterIds.mjs
import fs from "fs";
import crypto from "crypto";

const FILE = "src/data/guildCounter.json";

// 문자열 정리(공백/특수문자 최소화)
const norm = (s) =>
  String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9가-힣 _-]/g, "");

const sha8 = (s) => crypto.createHash("sha1").update(s).digest("hex").slice(0, 10);

const pickFirstOrder = (counter) => {
  const orders = Array.isArray(counter?.skillOrders) ? counter.skillOrders : [];
  return orders[0] || {};
};

const makeCounterId = (ctx) => {
  // ctx에 들어가는 값들이 바뀌지 않는 한 id는 항상 동일하게 생성됨
  const base = [
    `cat:${norm(ctx.category)}`,
    `team:${ctx.teamIndex}`,
    `variant:${ctx.variantIndex}`,
    `def:${norm(ctx.defenseLabel)}`,
    `defskills:${(ctx.defenseSkills || []).map(norm).join("|")}`,
    `heroes:${(ctx.heroNames || []).map(norm).join("|")}`,
    `speed:${norm(ctx.speedLabel)}`,
    `skills:${(ctx.skillFiles || []).map(norm).join("|")}`,
    `fa:${ctx.firstAttack ? 1 : 0}`,
    `pet:${(ctx.pets || []).map(norm).join("|")}`,
    `rec:${ctx.recommendation ?? ""}`,
    `note:${norm(ctx.note)}`,
  ].join("||");

  return `c-${sha8(base)}`; // 예: c-a1b2c3d4e5
};

const json = JSON.parse(fs.readFileSync(FILE, "utf8"));

let added = 0;

for (const [categoryName, teams] of Object.entries(json?.categories || {})) {
  if (!Array.isArray(teams)) continue;

  teams.forEach((teamObj, teamIndex) => {
    const defenseLabel = teamObj?.label || "";
    const variants = Array.isArray(teamObj?.defenseVariants) ? teamObj.defenseVariants : [];

    variants.forEach((variantObj, variantIndex) => {
      const defenseSkills = Array.isArray(variantObj?.defenseSkills) ? variantObj.defenseSkills : [];
      const counters = Array.isArray(variantObj?.counters) ? variantObj.counters : [];

      counters.forEach((counterObj) => {
        if (counterObj?.id) return; // 이미 있으면 건드리지 않음

        const firstOrder = pickFirstOrder(counterObj);
        const heroNames = (Array.isArray(counterObj?.team) ? counterObj.team : [])
          .slice(0, 3)
          .map((h) => h?.name || "");

        const ctx = {
          category: categoryName,
          teamIndex,
          variantIndex,
          defenseLabel,
          defenseSkills,
          heroNames,
          speedLabel: firstOrder?.label || "",
          skillFiles: Array.isArray(firstOrder?.skills) ? firstOrder.skills : [],
          firstAttack: !!counterObj?.firstAttack,
          pets: Array.isArray(counterObj?.pet) ? counterObj.pet : counterObj?.pet ? [counterObj.pet] : [],
          recommendation: counterObj?.recommendation,
          note: counterObj?.note || "",
        };

        counterObj.id = makeCounterId(ctx);
        added += 1;
      });
    });
  });
}

fs.writeFileSync(FILE, JSON.stringify(json, null, 2) + "\n", "utf8");
console.log(`✅ counter.id 자동 추가 완료: ${added}개`);
