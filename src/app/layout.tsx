import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "N'ASSIST OT CONTROL",
  description: "Application de traçabilité des objets trouvés"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
