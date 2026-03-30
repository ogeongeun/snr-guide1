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
];

export default raidBossOptions;

export const getRaidBossLabel = (bossKey) => {
  const found = raidBossOptions.find((x) => x.key === bossKey);
  return found?.label || bossKey || "";
};