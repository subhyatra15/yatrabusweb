// app/forgot-password/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const EMAIL = "support@yatrabus.com";
const PHONE = "+977 9714589280";
const PHONE_TEL = "+9779714589280";
const WHATSAPP_NUMBER = "9779714589280";

export default function Page() {
  const router = useRouter();
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const handleEmail = () => {
    try {
      const subject = encodeURIComponent("Password Reset Request");
      const body = encodeURIComponent(
        "Hello YatraBus Support,\n\nI forgot my password and would like to request a password reset.\n\nRegistered Phone Number: \nFull Name: \n\nThank you."
      );
      window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`;
    } catch (err) {
      console.error("Email error:", err);
      setAlertMsg("Could not open email app.");
    }
  };

  const handleCall = () => {
    window.location.href = `tel:${PHONE_TEL}`;
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      "Hello YatraBus Support, I forgot my password and need help resetting it."
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank");
  };

  const contactOptions = [
    {
      id: "email",
      title: "Email Support",
      subtitle: EMAIL,
      gradient: "from-emerald-600 to-emerald-400",
      svg: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      action: handleEmail,
    },
    {
      id: "phone",
      title: "Call Support",
      subtitle: PHONE,
      gradient: "from-violet-600 to-violet-400",
      svg: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      action: handleCall,
    },
    {
      id: "whatsapp",
      title: "WhatsApp",
      subtitle: PHONE,
      gradient: "from-green-600 to-green-500",
      svg: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.553 4.107 1.52 5.833L.058 23.5l5.83-1.528A11.933 11.933 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.82a9.78 9.78 0 01-5.002-1.373l-.358-.212-3.716.974.99-3.623-.232-.372A9.78 9.78 0 012.18 12c0-5.42 4.4-9.82 9.82-9.82 5.42 0 9.82 4.4 9.82 9.82 0 5.42-4.4 9.82-9.82 9.82z" />
        </svg>
      ),
      action: handleWhatsApp,
    },
  ];

  const steps = [
    {
      id: 1,
      title: "Verify Your Identity",
      desc: "Contact our support team with your registered phone number and full name.",
      svg: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      id: 2,
      title: "Set New Password",
      desc: "Our team will help you set a new password, and you can log in again.",
      svg: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8faff] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-slate-50 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-slate-900 flex-1 ml-2">Forgot Password</h1>
        <div className="w-10" />
      </header>

      {/* Alert banner (replaces RN Alert) */}
      {alertMsg && (
        <div className="mx-4 mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {alertMsg}
          <button onClick={() => setAlertMsg(null)} className="float-right font-bold">×</button>
        </div>
      )}

      <main className="flex-1 overflow-y-auto pb-24">
        {/* Hero */}
        <section className="px-4 pt-4 mb-4">
          <div className="rounded-3xl p-6 text-center bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/20">
            <div className="w-[72px] h-[72px] rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-[22px] font-extrabold text-white mb-1.5">Forgot Your Password?</h2>
            <p className="text-sm text-white/85 leading-5">
              No worries — our support team will help you get back into your account securely.
            </p>
          </div>
        </section>

        {/* Info banner */}
        <section className="px-4 mb-5">
          <div className="flex items-start gap-2.5 bg-indigo-600/[0.06] p-3.5 rounded-2xl border border-indigo-600/15">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="flex-1 text-[13px] text-indigo-700 leading-[19px] font-medium">
              For security reasons, password resets are handled manually by our support team. Please contact us using any option below.
            </p>
          </div>
        </section>

        {/* Steps */}
        <section className="px-4 mb-5">
          <h3 className="text-[17px] font-bold text-slate-900 mb-3">How It Works</h3>
          {steps.map((step) => (
            <div
              key={step.id}
              className="flex items-start gap-3 bg-white p-3.5 rounded-2xl mb-2.5 border border-indigo-600/5 shadow-sm shadow-indigo-500/5"
            >
              <div className="rounded-xl overflow-hidden shrink-0">
                <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
                  {step.svg}
                </div>
              </div>
              <div className="flex-1">
                <p className="text-[14.5px] font-bold text-slate-900 mb-1">
                  {step.id}. {step.title}
                </p>
                <p className="text-[13px] text-slate-500 leading-[18px]">{step.desc}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Contact options */}
        <section className="px-4 mb-5">
          <h3 className="text-[17px] font-bold text-slate-900 mb-3">Contact Support</h3>
          {contactOptions.map((option) => (
            <button
              key={option.id}
              onClick={option.action}
              className="w-full flex items-center bg-white p-3.5 rounded-2xl mb-3 border border-indigo-600/5 shadow-sm shadow-indigo-500/5 text-left active:opacity-80 transition-opacity"
            >
              <div className="rounded-xl overflow-hidden mr-3 shrink-0">
                <div className={`w-12 h-12 flex items-center justify-center rounded-xl text-white bg-gradient-to-br ${option.gradient}`}>
                  {option.svg}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold text-slate-900">{option.title}</p>
                <p className="text-[13px] text-slate-400 mt-0.5 truncate">{option.subtitle}</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </section>

        {/* Security note */}
        <section className="px-4 mb-5">
          <div className="flex items-start gap-3 bg-emerald-600/[0.06] p-3.5 rounded-2xl border border-emerald-600/15">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-[22px] w-[22px] text-emerald-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-bold text-emerald-700 mb-0.5">Your Security Matters</p>
              <p className="text-[13px] text-emerald-800 leading-[18px]">
                We&apos;ll never ask for your password over email or phone. Keep it private and only share identity details with our verified support team.
              </p>
            </div>
          </div>
        </section>

        {/* Back to login */}
        <section className="px-4">
          <button
            onClick={() => router.replace("/")}
            className="w-full rounded-2xl overflow-hidden shadow-lg shadow-indigo-500/25 active:opacity-85 transition-opacity"
          >
            <div className="flex items-center justify-center gap-2.5 py-4 min-h-[56px] bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-base font-bold tracking-wide">Back to Login</span>
            </div>
          </button>
        </section>
      </main>
    </div>
  );
}