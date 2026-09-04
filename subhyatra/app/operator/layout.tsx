import OperatorLayoutWrapper from "@/components/OperatorLayoutWrapper";
import { Fraunces, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const jbMono = JetBrains_Mono({
  variable: "--font-jbmono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export default function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${jakarta.variable} ${jbMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-paper text-ink">
        <main className="min-h-screen pb-0">
          <OperatorLayoutWrapper>
            {children}
          </OperatorLayoutWrapper>
        </main>
      </body>
    </html>
  );
}
