import type { Metadata } from "next";
import "./globals.css";
import { TopBar } from "../components/TopBar";
import { Toaster } from "react-hot-toast";
import SessionManager from "../components/SessionManager";
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
                <SessionManager />
                {children}
                <Toaster position="bottom-right" />
            </body>
        </html>
    );
}
