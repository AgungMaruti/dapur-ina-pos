import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({
	subsets: ["latin"],
	variable: "--font-inter",
	display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
	subsets: ["latin"],
	variable: "--font-plus-jakarta",
	display: "swap",
});

export const metadata: Metadata = {
	title: "Dapur Ina Aina — POS",
	description: "Sistem kasir, stok, produk, dan laporan Dapur Ina Aina.",
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
};

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="id">
			<body className={`${inter.variable} ${plusJakarta.variable}`}>
				{children}
			</body>
		</html>
	);
}
