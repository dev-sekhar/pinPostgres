import type { Metadata } from "next";
import "./globals.css";

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
            <body>{children}</body>
        </html>
    );
}
