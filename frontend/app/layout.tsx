import "@/styles/globals.css";
import {
  Plus_Jakarta_Sans,
  Inter,
  Lora,
  JetBrains_Mono,
} from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "react-hot-toast";

const displayFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  style: ["normal", "italic"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata = {
  title: "AmiSync | AI-Powered Career Platform",
  description:
    "Experience a premium, AI-driven career ecosystem for modern professionals.",
  icons: {
    icon: "/amisync-logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${bodyFont.variable} ${lora.variable} ${jetbrains.variable}`}
    >
      <body className="antialiased bg-bg text-text selection:bg-accent/10 font-sans">
        <ThemeProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              className: "toast-premium",
              style: {
                background: "var(--bg-surface)",
                color: "var(--text)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: "bold",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
