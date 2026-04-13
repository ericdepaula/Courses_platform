import { ReactNode } from "react";
import logo from "../../../assets/logo.png";

function Frame({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-[0_24px_80px_rgba(3,7,18,0.42)] backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}

export function BrandMark({ className = "h-11 w-11" }: { className?: string }) {
  return (
    <img src={logo} alt="Logo" className={`${className} object-contain`} />
  );
}

export function LoginScene() {
  return (
    <Frame className="ambient-grid p-6">
      <svg viewBox="0 0 520 420" className="w-full" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="loginSky" x1="90" y1="30" x2="412" y2="362" gradientUnits="userSpaceOnUse">
            <stop stopColor="#52B9EA" />
            <stop offset="1" stopColor="#5B6578" />
          </linearGradient>
        </defs>
        <circle cx="120" cy="82" r="66" fill="url(#loginSky)" opacity="0.32" />
        <circle cx="430" cy="80" r="46" fill="#8C98AB" opacity="0.18" />
        <rect x="64" y="84" width="392" height="252" rx="34" fill="#131D35" stroke="rgba(255,255,255,0.1)" />
        <rect x="92" y="116" width="162" height="178" rx="24" fill="#0D1324" stroke="#2B3551" />
        <rect x="282" y="116" width="146" height="54" rx="18" fill="#192540" />
        <rect x="282" y="186" width="146" height="54" rx="18" fill="#192540" />
        <rect x="282" y="256" width="98" height="28" rx="14" fill="#52B9EA" />
        <path d="M136 168C152 144 188 138 208 158C228 178 224 214 196 228C168 242 128 232 118 204C112 190 118 176 136 168Z" fill="#9ADAF6" />
        <path d="M162 162L186 200L216 146" stroke="#0D1324" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="160" cy="352" r="42" fill="#8C98AB" opacity="0.1" />
        <circle cx="404" cy="332" r="54" fill="#52B9EA" opacity="0.08" />
      </svg>
    </Frame>
  );
}

export function DashboardScene() {
  return (
    <Frame className="p-5">
      <svg viewBox="0 0 420 260" className="w-full" fill="none" aria-hidden="true">
        <rect x="18" y="28" width="384" height="206" rx="28" fill="#11192D" stroke="rgba(255,255,255,0.08)" />
        <rect x="38" y="48" width="116" height="166" rx="24" fill="#192540" />
        <rect x="174" y="48" width="208" height="58" rx="20" fill="#151F37" />
        <rect x="174" y="124" width="94" height="90" rx="22" fill="#52B9EA" opacity="0.88" />
        <rect x="288" y="124" width="94" height="90" rx="22" fill="#5B6578" opacity="0.82" />
        <path d="M68 173C90 144 113 132 126 132C139 132 145 152 145 163C145 174 141 185 124 194C107 203 82 201 68 173Z" fill="#9ADAF6" />
        <path d="M194 169C217 154 238 149 252 145" stroke="#FFF1DE" strokeWidth="12" strokeLinecap="round" />
        <path d="M305 191C324 160 341 146 360 140" stroke="#FFF1DE" strokeWidth="12" strokeLinecap="round" />
      </svg>
    </Frame>
  );
}

export function CourseScene() {
  return (
    <Frame className="p-4">
      <svg viewBox="0 0 400 240" className="w-full" fill="none" aria-hidden="true">
        <rect x="16" y="20" width="368" height="200" rx="32" fill="#10192E" />
        <rect x="38" y="44" width="212" height="132" rx="26" fill="url(#courseGradient)" />
        <rect x="270" y="44" width="92" height="28" rx="14" fill="#1A2847" />
        <rect x="270" y="86" width="92" height="28" rx="14" fill="#1A2847" />
        <rect x="270" y="128" width="72" height="28" rx="14" fill="#1A2847" />
        <circle cx="144" cy="110" r="34" fill="rgba(13,19,36,0.72)" />
        <path d="M134 94L162 110L134 126V94Z" fill="#FFF1DE" />
        <path d="M68 194H332" stroke="rgba(255,255,255,0.1)" strokeWidth="10" strokeLinecap="round" />
        <defs>
          <linearGradient id="courseGradient" x1="54" y1="44" x2="228" y2="178" gradientUnits="userSpaceOnUse">
            <stop stopColor="#52B9EA" />
            <stop offset="1" stopColor="#5B6578" />
          </linearGradient>
        </defs>
      </svg>
    </Frame>
  );
}

export function CertificateScene() {
  return (
    <Frame className="p-5">
      <svg viewBox="0 0 380 240" className="w-full" fill="none" aria-hidden="true">
        <rect x="28" y="28" width="324" height="184" rx="28" fill="#131D35" stroke="rgba(255,255,255,0.09)" />
        <rect x="48" y="48" width="284" height="144" rx="24" fill="#EAF7FE" />
        <path d="M88 88H292" stroke="#52B9EA" strokeWidth="10" strokeLinecap="round" />
        <path d="M88 122H250" stroke="#9ADAF6" strokeWidth="10" strokeLinecap="round" />
        <path d="M88 154H224" stroke="#9ADAF6" strokeWidth="10" strokeLinecap="round" />
        <circle cx="282" cy="132" r="30" fill="#52B9EA" />
        <path d="M282 113L287.878 125.91L302 128.09L291 137.34L293.756 151.41L282 145L270.244 151.41L273 137.34L262 128.09L276.122 125.91L282 113Z" fill="#EAF7FE" />
      </svg>
    </Frame>
  );
}

export function SettingsScene() {
  return (
    <Frame className="p-5">
      <svg viewBox="0 0 380 220" className="w-full" fill="none" aria-hidden="true">
        <rect x="26" y="26" width="328" height="168" rx="28" fill="#10192E" />
        <rect x="52" y="52" width="104" height="116" rx="24" fill="#1A2847" />
        <circle cx="104" cy="94" r="22" fill="#52B9EA" />
        <path d="M82 146C92 130 117 125 132 137C147 149 145 164 145 168H66C66 159 72 150 82 146Z" fill="#9ADAF6" />
        <rect x="178" y="62" width="142" height="24" rx="12" fill="#223252" />
        <rect x="178" y="102" width="122" height="24" rx="12" fill="#223252" />
        <rect x="178" y="142" width="90" height="24" rx="12" fill="#8C98AB" opacity="0.78" />
      </svg>
    </Frame>
  );
}
