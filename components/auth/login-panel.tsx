"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Brand } from "@/components/site/brand";
import { LanguageSwitcher } from "@/components/site/header";
import { Icon } from "@/components/ui/icon";
import { dictionaries, href, type Locale } from "@/lib/i18n";
import { company, media } from "@/lib/public-content";
import { requestCopy } from "@/lib/request-copy";

export function LoginPanel({ locale = "en" }: { locale?: Locale }) {
  const [showPassword, setShowPassword] = useState(false);
  const d = dictionaries[locale],
    image = media.home;
  return (
    <main id="main-content" className="auth-page" data-page-path={href(locale, "login")}>
      <div className="auth-art">
        <Image
          src={image.src}
          alt=""
          fill
          sizes="(max-width: 767px) 100vw, 50vw"
          loading="eager"
        />
        <div className="auth-art-shade" />
        <Brand appearance="dark" locale={locale} />
        <div className="auth-art-copy">
          <h2 lang="en">
            {d.heroTitle}
            <br />
            <em>{d.heroAccent}</em>
          </h2>
          <p>{d.conceptVisual}</p>
        </div>
      </div>
      <div className="auth-content">
        <div className="auth-top">
          <Link className="text-link" href={href(locale)}>
            {d.backHome}
          </Link>
          <LanguageSwitcher locale={locale} />
        </div>
        <div className="auth-form-wrap">
          <p className="section-label">{d.login}</p>
          <h1>{d.loginTitle}</h1>
          <div className="notice" id="auth-availability">
            <strong>{d.authNotice}</strong>
            <p>{d.authDescription}</p>
          </div>
          <fieldset aria-describedby="auth-availability">
            <legend className="sr-only">{d.login}</legend>
            <label className="field">
              <span>{d.username}</span>
              <input type="text" name="username" autoComplete="off" disabled />
            </label>
            <label className="field">
              <span>{d.password}</span>
              <span className="password-field">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="off"
                  disabled
                />
                <button
                  type="button"
                  className="icon-button"
                  aria-label={showPassword ? d.hidePassword : d.showPassword}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <Icon name={showPassword ? "eyeOff" : "eye"} />
                </button>
              </span>
            </label>
            <button
              type="button"
              className="button button-gold auth-submit"
              disabled
            >
              {d.signInUnavailable}
            </button>
          </fieldset>
          <p className="content-note">{d.authFootnote}</p>
          <Link className="text-link" href={href(locale, "contact")}>
            {d.contact}
          </Link>
        </div>
        <div className="auth-bottom">
          <p>© {company.name}</p>
          <Link href={href(locale, "privacy")}>{requestCopy(locale).privacy}</Link>
        </div>
      </div>
    </main>
  );
}
