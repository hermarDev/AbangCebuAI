import type { Metadata, Viewport } from "next";
import "@fontsource-variable/manrope";
import "@fontsource/dm-serif-display/400.css";
import "maplibre-gl/dist/maplibre-gl.css";
import "@/styles/globals.css";
import "@/styles/finder.css";

export const metadata: Metadata = {
  title: "AbangCebu — Find your place in Cebu",
  description: "Explore Cebu and discover a place to call home. A local room and boarding-house finder.",
  icons: {
    icon: [
      { url: "/icons/logo_Only.png?v=2", type: "image/png" },
    ],
    shortcut: "/icons/logo_Only.png?v=2",
    apple: "/icons/logo_Only.png?v=2",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0066d5",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
