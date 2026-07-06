import type { Metadata } from "next";
import "./globals.css";
import { TopBar } from "../components/TopBar";

export const metadata: Metadata = {
    title: "PIM Postgres",
    description: "Product Information Management demo",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>
                <TopBar />
                {children}
            </body>
        </html>
    );
}
