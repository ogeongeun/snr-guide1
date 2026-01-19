export function getKoreanAuthError(error) {
  if (!error) return "알 수 없는 오류가 발생했습니다.";

  const msg = String(error.message || "");
  const code = String(error.code || "");

  // code 우선(있을 때)
  if (code === "user_already_exists") return "이미 가입된 이메일입니다.";
  if (code === "invalid_credentials") return "이메일 또는 비밀번호가 올바르지 않습니다.";
  if (code === "email_not_confirmed") return "이메일 인증이 완료되지 않았습니다.";

  // message 기반(대부분 여기로 들어옴)
  if (msg.includes("Invalid login credentials")) {
    return "이메일 또는 비밀번호가 올바르지 않습니다.";
  }
  if (msg.includes("User already registered")) {
    return "이미 가입된 이메일입니다.";
  }
  if (msg.includes("Password should be at least")) {
    return "비밀번호는 최소 6자 이상이어야 합니다.";
  }
  if (msg.includes("Invalid email")) {
    return "이메일 형식이 올바르지 않습니다.";
  }
  if (msg.toLowerCase().includes("rate limit")) {
    return "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
  }

  return "로그인/회원가입 중 오류가 발생했습니다.";
}
