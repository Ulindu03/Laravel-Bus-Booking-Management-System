import { Raleway } from "next/font/google";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import Preloader from "@/components/common/Preloader";
import ChatWidget from "@/components/common/ChatWidget";
import { AuthProvider } from "./context/AuthContext";

import "./globals.css";

const raleway = Raleway({
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700", "800", "900"],
    display: "swap",
});

export default function RootLayout({ children }) {
    return (
        <html lang="en" style={{ colorScheme: 'dark' }}>
            <body className={raleway.className}>
                <Preloader />
                <AuthProvider>
                    <Header />
                    {children}
                    <Footer />
                    <ChatWidget />
                </AuthProvider>
            </body>
        </html>
    );
}