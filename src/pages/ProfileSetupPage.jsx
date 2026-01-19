import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

const GUILD_PRESETS = ["천우회", "백우회", "Madday", "조림", "Platinum"];

export default function ProfileSetupPage() {
  const [loading, setLoading] = useState(true);

  const [nickname, setNickname] = useState("");
  const [session, setSession] = useState(null);

  // ✅ 길드: 프리셋 선택 OR 직접 입력
  const [guildMode, setGuildMode] = useState("preset"); // "preset" | "custom"
  const [guildPreset, setGuildPreset] = useState("");
  const [guildCustom, setGuildCustom] = useState("");

  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const composedGuild = useMemo(() => {
    if (guildMode === "custom") return (guildCustom || "").trim();
    return (guildPreset || "").trim();
  }, [guildMode, guildPreset, guildCustom]);

  useEffect(() => {
    const run = async () => {
      // 로그인 세션 확인
      const { data: sessionRes } = await supabase.auth.getSession();
      const sess = sessionRes?.session;

      if (!sess) {
        navigate("/login", { replace: true });
        return;
      }

      setSession(sess);

      // 기존 닉네임/길드 조회
      const { data, error } = await supabase
        .from("profiles")
        .select("nickname,guild")
        .eq("user_id", sess.user.id)
        .single();

      // 이미 닉네임이 있으면 바로 홈으로
      // (길드는 나중에 바꿀 수 있으니 닉네임만 기준으로 유지)
      if (!error && data?.nickname && data.nickname !== "익명") {
        navigate("/", { replace: true });
        return;
      }

      // 기존 닉네임 채우기
      if (!error && data?.nickname) {
        setNickname(data.nickname);
      }

      // ✅ 기존 길드가 있으면 preset/custom 모드 자동 세팅
      const currentGuild = (data?.guild || "").trim();
      if (currentGuild) {
        if (GUILD_PRESETS.includes(currentGuild)) {
          setGuildMode("preset");
          setGuildPreset(currentGuild);
          setGuildCustom("");
        } else {
          setGuildMode("custom");
          setGuildPreset("");
          setGuildCustom(currentGuild);
        }
      } else {
        setGuildMode("preset");
        setGuildPreset("");
        setGuildCustom("");
      }

      setLoading(false);
    };

    run();
  }, [navigate]);

  const save = async () => {
    const nick = nickname.trim();
    const guildValue = composedGuild;

    if (!nick) {
      alert("닉네임 입력해줘");
      return;
    }
    if (!session?.user?.id) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      setSaving(true);

      // ✅ 닉네임 + 길드 한번에 upsert
      const { error } = await supabase
        .from("profiles")
        .upsert(
          {
            user_id: session.user.id,
            nickname: nick,
            guild: guildValue.length ? guildValue : null,
          },
          { onConflict: "user_id" }
        );

      if (error) {
        alert(error.message);
        return;
      }

      navigate("/", { replace: true });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 16 }}>로딩중...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-6 rounded-xl shadow w-full max-w-md">
        <h1 className="text-xl font-bold text-center mb-4">프로필 설정</h1>

        {/* 닉네임 */}
        <div className="mb-4">
          <div className="text-sm font-bold mb-2">닉네임</div>
          <input
            className="w-full border rounded-xl px-3 py-2 text-sm"
            placeholder="닉네임"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
          <div className="mt-1 text-xs text-gray-500">인게임 닉네임(다르면 삭제될수있음)</div>
        </div>

        {/* 길드 */}
        <div className="mb-4">
          <div className="text-sm font-bold mb-2">길드</div>

          <div className="flex flex-wrap gap-2 mb-2">
            <button
              type="button"
              onClick={() => setGuildMode("preset")}
              className={`rounded-xl px-3 py-2 text-sm font-bold border ${
                guildMode === "preset"
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
              }`}
            >
              목록에서 선택
            </button>

            <button
              type="button"
              onClick={() => setGuildMode("custom")}
              className={`rounded-xl px-3 py-2 text-sm font-bold border ${
                guildMode === "custom"
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
              }`}
            >
              직접 입력(추가)
            </button>
          </div>

          {guildMode === "preset" ? (
            <select
              value={guildPreset}
              onChange={(e) => setGuildPreset(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-sm bg-white"
            >
              <option value="">선택(미지정)</option>
              {GUILD_PRESETS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          ) : (
            <input
              className="w-full border rounded-xl px-3 py-2 text-sm"
              placeholder="예: 내 길드명 입력"
              value={guildCustom}
              onChange={(e) => setGuildCustom(e.target.value)}
            />
          )}

          <div className="mt-2 text-xs text-gray-500">
            저장될 값:{" "}
            <span className="font-bold text-gray-800">
              {composedGuild ? composedGuild : "(미지정)"}
            </span>
          </div>
        </div>

        <button
          className="w-full bg-gray-800 text-white rounded-xl py-2 font-bold disabled:opacity-50"
          onClick={save}
          disabled={saving}
        >
          {saving ? "저장중..." : "저장하고 시작하기"}
        </button>
      </div>
    </div>
  );
}
