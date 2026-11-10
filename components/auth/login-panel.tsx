"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import {authClient} from "@/lib/auth-client";
import {useRouter} from "next/navigation";
import { Brand } from "@/components/site/brand";
import { LanguageSwitcher } from "@/components/site/header";
import { Icon } from "@/components/ui/icon";
import { dictionaries, href, type Locale } from "@/lib/i18n";
import { company, media } from "@/lib/public-content";
import { requestCopy } from "@/lib/request-copy";

export function LoginPanel({ locale = "en",configured=false }: { locale?: Locale;configured?:boolean }) {
  const [showPassword, setShowPassword] = useState(false);
  const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const router=useRouter();
  async function signIn(event:FormEvent){
    event.preventDefault();if(!configured||busy)return;setBusy(true);setMessage('');
    try{const result=await authClient.signIn.email({email,password});if(result.error){setMessage(locale==='bn'?'লগইন করা যায়নি। তথ্য যাচাই করে আবার চেষ্টা করুন।':'Sign-in failed. Check your details or request an administrator-issued recovery link.');return;}setPassword('');router.replace((result.data as {twoFactorRedirect?:boolean})?.twoFactorRedirect?`/${locale}/security`:`/${locale}/admin`);router.refresh();}
    catch{setMessage(locale==='bn'?'লগইন সেবা এখন পাওয়া যাচ্ছে না।':'The sign-in service is currently unavailable.');}finally{setBusy(false);}
  }
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
          {!configured&&<div className="notice" id="auth-availability">
            <strong>{d.authNotice}</strong>
            <p>{d.authDescription}</p>
          </div>}
          <form onSubmit={signIn}><fieldset aria-describedby={!configured?"auth-availability":undefined} disabled={busy||!configured}>
            <legend className="sr-only">{d.login}</legend>
            <label className="field">
              <span>{locale==='bn'?'ইমেইল':'Email'}</span>
              <input type="email" name="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} required maxLength={254}/>
            </label>
            <label className="field">
              <span>{d.password}</span>
              <span className="password-field">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password} onChange={e=>setPassword(e.target.value)} required maxLength={128}
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
              type="submit"
              className="button button-gold auth-submit"
            >
              {configured?(busy?(locale==='bn'?'অপেক্ষা করুন…':'Signing in…'):(locale==='bn'?'লগইন করুন':'Sign in')):d.signInUnavailable}
            </button>
          </fieldset></form>
          {message&&<p role="alert" className="notice">{message}</p>}
          <p className="content-note">{configured?(locale==='bn'?'অ্যাকাউন্ট বা পাসওয়ার্ড পুনরুদ্ধারের লিংকের জন্য আপনার প্রশাসকের সঙ্গে যোগাযোগ করুন।':'For account access or a single-use recovery link, contact your administrator.'):d.authFootnote}</p>
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
