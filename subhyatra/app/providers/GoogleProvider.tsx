"use client";

import Script from "next/script";
import { createContext, useContext, useCallback, useRef } from "react";

type GoogleUser = {
  idToken: string;
  email: string | null;
  name: string | null;
  photo: string | null;
};

type GoogleContextValue = {
  signInWithGoogle: () => Promise<GoogleUser | null>;
};

const GoogleContext = createContext<GoogleContextValue | null>(null);

export function useGoogle() {
  const ctx = useContext(GoogleContext);
  if (!ctx) throw new Error("useGoogle must be used inside <GoogleProvider>");
  return ctx;
}

export function GoogleProvider({ children }: { children: React.ReactNode }) {
  const resolverRef = useRef<((u: GoogleUser | null) => void) | null>(null);
  const rejectRef = useRef<((e: Error) => void) | null>(null);

  const handleCredential = useCallback((response: any) => {
    const resolver = resolverRef.current;
    resolverRef.current = null;
    rejectRef.current = null;
    if (!response?.credential) {
      resolver?.(null);
      return;
    }
    try {
      const payload = JSON.parse(
        atob(
          response.credential
            .split(".")[1]
            .replace(/-/g, "+")
            .replace(/_/g, "/"),
        ),
      );
      resolver?.({
        idToken: response.credential,
        email: payload.email ?? null,
        name: payload.name ?? null,
        photo: payload.picture ?? null,
      });
    } catch (e) {
      resolver?.(null);
    }
  }, []);

  const signInWithGoogle = useCallback(() => {
    return new Promise<GoogleUser | null>((resolve, reject) => {
      const google = (window as any).google;
      if (!google?.accounts?.id) {
        reject(new Error("Google Identity Services not loaded yet."));
        return;
      }

      resolverRef.current = resolve;
      rejectRef.current = reject;

      google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: handleCredential,
        ux_mode: "popup",
        auto_select: false,
      });

      // Render an offscreen button and click it — this reliably opens
      // the popup without requiring a dedicated <div id="g_id_signin">.
      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.left = "-9999px";
      document.body.appendChild(container);

      google.accounts.id.renderButton(container, {
        type: "standard",
        size: "large",
      });

      const btn =
        container.querySelector<HTMLDivElement>('[role="button"]') ??
        container.querySelector<HTMLDivElement>("div[tabindex]");
      if (btn) {
        btn.click();
      } else {
        // Fallback: programmatic prompt
        google.accounts.id.prompt();
      }

      // Cleanup after a tick
      setTimeout(() => {
        if (container.parentNode) container.parentNode.removeChild(container);
      }, 50);

      // Safety timeout — if the popup is closed without a callback,
      // resolve with null after 2 minutes so the UI doesn't hang forever.
      setTimeout(() => {
        if (resolverRef.current === resolve) {
          resolverRef.current = null;
          rejectRef.current = null;
          resolve(null);
        }
      }, 120_000);
    });
  }, [handleCredential]);

  return (
    <GoogleContext.Provider value={{ signInWithGoogle }}>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
      />
      {children}
    </GoogleContext.Provider>
  );
}