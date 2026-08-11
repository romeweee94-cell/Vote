import "./globals.css";

export const metadata = {
  title: "โหวตกันเถอะ",
  description: "ระบบโหวตออนไลน์",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body className="min-h-screen bg-brand-cream text-gray-800 font-sans">
        {children}
      </body>
    </html>
  );
}
