import "./globals.css";

export const metadata = {
  title: "Cinematic Sci-Fi Chase",
  description: "A 20 second cinematic sci-fi spacecraft chase rendered in Three.js",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
