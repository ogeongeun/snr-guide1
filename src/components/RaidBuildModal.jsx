export default function RaidBuildModal({ hero, onClose }) {
  if (!hero) return null;

  const b = hero.build || {};
  const weapon = b.weapon || {};
  const armor = b.armor || {};

  const heroImageSrc = hero.hero_image?.startsWith("/images/")
    ? hero.hero_image
    : `/images/heroes/${hero.hero_image || ""}`;

  const setName = (b.set && String(b.set).trim()) || "-";
  const speedText = Number.isFinite(b.speed) ? `${b.speed}` : "-";

  const vWeapon1 = (weapon.main1 && String(weapon.main1).trim()) || "-";
  const vWeapon2 = (weapon.main2 && String(weapon.main2).trim()) || "-";
  const vArmor1 = (armor.main1 && String(armor.main1).trim()) || "-";
  const vArmor2 = (armor.main2 && String(armor.main2).trim()) || "-";

  const subOpt = (b.subOption && String(b.subOption).trim()) || "-";
  const note = (b.note && String(b.note).trim()) || "-";

  const Row = ({ label, value, mono = false }) => (
    <div className="grid grid-cols-[70px_1fr] gap-2 py-1.5">
      <div className="text-[11px] font-extrabold text-slate-500">{label}</div>
      <div
        className={[
          "text-[12px] font-extrabold text-slate-900 leading-snug break-words",
          mono ? "font-mono font-bold" : "",
        ].join(" ")}
        title={value !== "-" ? value : undefined}
      >
        {value}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-3">
      <div className="w-[92vw] max-w-sm bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-3 py-2 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center shrink-0">
              {hero.hero_image ? (
                <img
                  src={heroImageSrc}
                  alt={hero.hero_name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-[10px] font-extrabold text-slate-400">없음</div>
              )}
            </div>

            <div className="min-w-0">
              <div className="text-[13px] font-black text-slate-900 truncate">
                {hero.hero_name || "영웅"}
              </div>
              <div className="mt-0.5 text-[11px] font-semibold text-slate-500">
                저장된 장비 세팅
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 active:scale-95 transition"
            aria-label="닫기"
            title="닫기"
          >
            ✕
          </button>
        </div>

        <div className="p-3 bg-slate-50">
          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
            <Row label="세트" value={setName} />
            <Row label="속공" value={speedText} />

            <div className="my-2 h-px bg-slate-200" />

            <Row label="무기1" value={vWeapon1} />
            <Row label="무기2" value={vWeapon2} />
            <Row label="방어1" value={vArmor1} />
            <Row label="방어2" value={vArmor2} />

            <div className="my-2 h-px bg-slate-200" />

            <Row label="부옵" value={subOpt} mono />
            <Row label="메모" value={note} />
          </div>
        </div>

        <div className="px-3 py-2 border-t border-slate-200 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-[12px] font-extrabold hover:bg-slate-800 transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}