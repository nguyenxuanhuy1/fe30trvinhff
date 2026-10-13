"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ManOutlined, WomanOutlined } from "@ant-design/icons";
import { useAuth } from "@/modules/auth";
import type { LoginPayload, RegisterPayload } from "@/modules/auth/types";
import { loginPageContent } from "./login.const";
import "./login.scss";

type AuthMode = "login" | "register";

// Đọc ?next= để sau khi đăng nhập quay lại đúng trang bị chặn, ví dụ /admin.
// Mặc định luôn đẩy sang /lessons là trang chủ của trò chơi
function getNextPath(): string {
  if (typeof window === "undefined") return "/lessons";
  const next = new URLSearchParams(window.location.search).get("next");
  return next !== null && next.startsWith("/") && !next.startsWith("//") && next !== "/" ? next : "/lessons";
}

function LoginPage() {
  const router = useRouter();
  const { user, isLoading, login, register } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE">("MALE");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLogin = mode === "login";

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(getNextPath());
    }
  }, [isLoading, user, router]);

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (isLogin) {
      setIsSubmitting(true);
      try {
        const payload: LoginPayload = { username, password };
        await login(payload);
        router.push(getNextPath());
      } catch {
        setError(loginPageContent.errors.invalidCredentials);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (password !== confirmPassword) {
      setError(loginPageContent.errors.passwordMismatch);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: RegisterPayload = { username, password, gender };
      await register(payload);
      router.push(getNextPath());
    } catch (e) {
      const apiError = e as { response?: { data?: { message?: string } } };
      setError(apiError.response?.data?.message ?? loginPageContent.errors.registrationFailed);
    } finally {
      setIsSubmitting(false);
    }
  }

  const loginTabClass = isLogin ? "login__tab login__tab-active" : "login__tab";
  const registerTabClass = isLogin ? "login__tab" : "login__tab login__tab-active";

  return (
    <div className="login-page">
      {/* 1. Lớp hình nền bgcard.png */}
      <div className="login-page__bg-media" aria-hidden="true">
        <Image
          className="login-page__bg-img"
          src="/images/bgcard.png"
          alt=""
          fill
          priority
          sizes="100vw"
        />
      </div>

      {/* 2. Nút quay lại góc trên trái */}
      <div className="login-page__top-nav">
        <Link href="/lessons" className="login-page__back-btn" title="Quay lại">
          <svg
            className="login-page__back-icon"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>Quay lại</span>
        </Link>
      </div>

      {/* 3. Thẻ form đăng nhập / đăng ký phong cách Steam */}
      <div className="login__card">
        <Link className="login__logo" href="/" aria-label="Về trang chủ">
          <Image src="/images/logo.png" alt="Game Center" width={220} height={81} priority />
        </Link>

        <div className="login__tabs" role="tablist">
          <button
            className={loginTabClass}
            type="button"
            role="tab"
            aria-selected={isLogin}
            onClick={() => switchMode("login")}
          >
            ĐĂNG NHẬP
          </button>
          <button
            className={registerTabClass}
            type="button"
            role="tab"
            aria-selected={!isLogin}
            onClick={() => switchMode("register")}
          >
            ĐĂNG KÝ
          </button>
        </div>

        <form className="login__form" onSubmit={handleSubmit}>
          <label className="login__field">
            <span className="login__label">Tài khoản</span>
            <input
              className="login__input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tên đăng nhập"
              required
              minLength={3}
              maxLength={50}
              autoComplete="username"
            />
          </label>

          <label className="login__field">
            <span className="login__label">Mật khẩu</span>
            <input
              className="login__input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              required
              minLength={6}
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </label>

          {!isLogin && (
            <>
              <label className="login__field">
                <span className="login__label">Xác nhận mật khẩu</span>
                <input
                  className="login__input"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </label>

              {/* Lựa chọn Giới tính bằng ô radio (Nam / Nữ) */}
              <div className="login__field">
                <span className="login__label">Giới tính</span>
                <div className="login__gender-radio-group" role="radiogroup" aria-label="Chọn giới tính">
                  <label className={`login__gender-radio ${gender === "MALE" ? "login__gender-radio--active" : ""}`}>
                    <input
                      type="radio"
                      name="gender"
                      value="MALE"
                      checked={gender === "MALE"}
                      onChange={() => setGender("MALE")}
                      className="login__gender-radio-input"
                    />
                    <span className="login__gender-icon login__gender-icon--male">
                      <ManOutlined />
                    </span>
                    <span className="login__gender-text">Nam</span>
                  </label>

                  <label className={`login__gender-radio ${gender === "FEMALE" ? "login__gender-radio--active" : ""}`}>
                    <input
                      type="radio"
                      name="gender"
                      value="FEMALE"
                      checked={gender === "FEMALE"}
                      onChange={() => setGender("FEMALE")}
                      className="login__gender-radio-input"
                    />
                    <span className="login__gender-icon login__gender-icon--female">
                      <WomanOutlined />
                    </span>
                    <span className="login__gender-text">Nữ</span>
                  </label>
                </div>
              </div>
            </>
          )}

          {error !== null && <p className="login__error">{error}</p>}

          <button className="login__submit" type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? loginPageContent.submitting
              : isLogin
                ? "ĐĂNG NHẬP NGAY"
                : "TẠO TÀI KHOẢN NGAY"}
          </button>
        </form>

        <p className="login__switch">
          {isLogin ? loginPageContent.switchPrompt.register : loginPageContent.switchPrompt.login}
          <button
            className="login__switch-button"
            type="button"
            onClick={() => switchMode(isLogin ? "register" : "login")}
          >
            {isLogin ? loginPageContent.switchAction.register : loginPageContent.switchAction.login}
          </button>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
export type { AuthMode };

