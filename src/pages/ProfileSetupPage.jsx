// src/pages/ProfileSetupPage.jsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

const GUILD_PRESETS = [
  "천우회",
  "백우회",
  "Madday",
  "운명",
  "조림",
  "Platinum",
  "Luckyday",
  "실버타운",
  "추악",
  "흑령",
];

const DUP_TEXT =
  "중복시 이전에 가입한 닉네임이있습니다 관리자에게 말해서 삭제후 가입부탁드립니다";

const normalize = (s) => (s ?? "").trim().toLowerCase();
const isTempNick = (n) => (n ?? "").startsWith("TEMP_");

export default function ProfileSetupPage() {
  const [loading, setLoading] = useState(true);

  const [nickname, setNickname] = useState("");
  const [session, setSession] = useState(null);

  // ✅ 길드: 무조건 프리셋 중 하나 선택 (미지정 불가)
  const [guildPreset, setGuildPreset] = useState(GUILD_PRESETS[0] ?? "");

  const [saving, setSaving] = useState(false);
  const [dupWarn, setDupWarn] = useState("");
  const navigate = useNavigate();

  const composedGuild = useMemo(() => (guildPreset || "").trim(), [guildPreset]);

  useEffect(() => {
    const run = async () => {
      try {
        const { data: sessionRes } = await supabase.auth.getSession();
        const sess = sessionRes?.session;

        if (!sess) {
          navigate("/login", { replace: true });
          return;
        }

        setSession(sess);

        const { data, error } = await supabase
          .from("profiles")
          .select("nickname,guild,guild_id")
          .eq("user_id", sess.user.id)
          .single();

        const hasFinalNickname =
          !error &&
          data?.nickname &&
          data.nickname !== "익명" &&
          !isTempNick(data.nickname);

        if (hasFinalNickname) {
          navigate("/", { replace: true });
          return;
        }

        if (!error && data?.nickname && !isTempNick(data.nickname) && data.nickname !== "익명") {
          setNickname(data.nickname);
        } else {
          setNickname("");
        }

        // ✅ 길드: 프리셋이면 그대로, 아니면 기본값(첫 프리셋)
        const currentGuild = (data?.guild || "").trim();
        if (currentGuild && GUILD_PRESETS.includes(currentGuild)) {
          setGuildPreset(currentGuild);
        } else {
          setGuildPreset(GUILD_PRESETS[0] ?? "");
        }
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [navigate]);

  const checkDuplicateNickname = async (rawNick) => {
    const n = normalize(rawNick);
    if (!n) return false;

    const { data, error } = await supabase
      .from("profiles")
      .select("user_id,nickname")
      .limit(2000);

    if (error) throw error;

    const myId = session?.user?.id;
    const hit = (data ?? []).find(
      (row) => normalize(row.nickname) === n && row.user_id !== myId
    );

    return !!hit;
  };

  const save = async () => {
    const nick = nickname.trim();
    const guildValue = composedGuild.trim();

    setDupWarn("");

    if (!nick) {
      alert("닉네임 입력해줘");
      return;
    }
    if (!session?.user?.id) {
      alert("로그인이 필요합니다.");
      return;
    }

    // ✅ 미지정 불가 + 프리셋 강제
    if (!guildValue.length || !GUILD_PRESETS.includes(guildValue)) {
      alert("길드는 반드시 목록에서 선택해야 합니다.");
      return;
    }

    try {
      setSaving(true);

      const isDup = await checkDuplicateNickname(nick);
      if (isDup) {
        setDupWarn(DUP_TEXT);
        return;
      }

      // 1) guilds에서 길드 id 조회
      const { data: found, error: findErr } = await supabase
        .from("guilds")
        .select("id")
        .eq("name", guildValue)
        .maybeSingle();

      if (findErr) {
        alert(findErr.message);
        return;
      }

      let guildId = found?.id ?? null;

      // 2) 없으면 guilds에 생성
      if (!guildId) {
        const { data: created, error: createErr } = await supabase
          .from("guilds")
          .insert({ name: guildValue })
          .select("id")
          .single();

        if (createErr) {
          const { data: retry, error: retryErr } = await supabase
            .from("guilds")
            .select("id")
            .eq("name", guildValue)
            .single();

          if (retryErr) {
            alert(createErr.message);
            return;
          }
          guildId = retry.id;
        } else {
          guildId = created.id;
        }
      }

      // 3) profiles에 닉네임 + 길드 + guild_id upsert
      const { error } = await supabase
        .from("profiles")
        .upsert(
          {
            user_id: session.user.id,
            nickname: nick,
            guild: guildValue,
            guild_id: guildId,
          },
          { onConflict: "user_id" }
        );

      if (error) {
        if (error.code === "23505") {
          setDupWarn(DUP_TEXT);
          return;
        }
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

        {dupWarn ? (
          <div className="mb-4 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
            {dupWarn}
          </div>
        ) : null}

        <div className="mb-4">
          <div className="text-sm font-bold mb-2">닉네임</div>
          <input
            className="w-full border rounded-xl px-3 py-2 text-sm"
            placeholder="닉네임"
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value);
              if (dupWarn) setDupWarn("");
            }}
          />
          <div className="mt-1 text-xs text-gray-500">
            인게임 닉네임(다르면 삭제될수있음)
          </div>
        </div>

        <div className="mb-4">
          <div className="text-sm font-bold mb-2">길드</div>

          <div className="mb-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
            길드는 정해진 목록에서만 선택 가능합니다.
          </div>

          <select
            value={guildPreset}
            onChange={(e) => setGuildPreset(e.target.value)}
            className="w-full border rounded-xl px-3 py-2 text-sm bg-white"
          >
            {GUILD_PRESETS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          <div className="mt-2 text-xs text-gray-500">
            저장될 값:{" "}
            <span className="font-bold text-gray-800">{composedGuild}</span>
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
