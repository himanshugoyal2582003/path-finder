import { ClerkProvider } from "@clerk/nextjs";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "Life Path Finder — AI Career & Learning Roadmap",
  description: "Personalized, explainable career roadmaps powered by multi-agent AI. Identify skill gaps and get a phased curriculum instantly.",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
        <head>
          <link rel="icon" href="/favicon.ico" />
        </head>
        <body>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}

