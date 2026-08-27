import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "СДТ — усиление конструкций и гидроизоляция",
  description: "Обследование, проектирование, усиление и гидроизоляция строительных конструкций в Москве и Московской области.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}
