import type { Metadata } from "next";
export const metadata: Metadata = { title: "Rentry API", description: "Rentry Engineering API service" };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }
