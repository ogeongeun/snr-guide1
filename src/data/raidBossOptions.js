const raidBossOptions = [
  {
    key: "destruction_eye_15",
    label: "파멸의 눈동자(15단계)",
  },
  {
    key: "uma_king_15",
    label: "우마왕(15단계)",
  },
  {
    key: "steel_predator_15",
    label: "강철의 포식자(15단계)",
  },
    { key: "leonid_event", label: "레오니드(돌발)" },
  { key: "astrea_event", label: "아스트레아(돌발)" },
  { key: "kallistra_event", label: "칼리스트라(돌발)" },
];

export default raidBossOptions;

export const getRaidBossLabel = (bossKey) => {
  const found = raidBossOptions.find((x) => x.key === bossKey);
  return found?.label || bossKey || "";
};