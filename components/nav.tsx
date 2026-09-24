"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	BarChart3,
	Boxes,
	LogOut,
	type LucideIcon,
	Package,
	QrCode,
	ReceiptText,
	ShieldCheck,
	ShoppingBag,
	Utensils,
} from "lucide-react";

interface Item {
	href: string;
	match: string;
	label: string;
	Icon: LucideIcon;
	/** hanya tampil di desktop (mobile: 4 item sesuai desain) */
	desktopOnly?: boolean;
}

const KASIR: Item[] = [
	{ href: "/kasir/menu?category=makanan", match: "/kasir/menu", label: "Menu", Icon: Utensils },
	{ href: "/kasir/pesanan", match: "/kasir/pesanan", label: "Pesanan", Icon: ShoppingBag },
	{ href: "/kasir/pembayaran?method=tunai", match: "/kasir/pembayaran", label: "Bayar", Icon: QrCode },
	{ href: "/kasir/struk/terakhir", match: "/kasir/struk", label: "Struk", Icon: ReceiptText, desktopOnly: true },
	{ href: "/kasir/logout", match: "/kasir/logout", label: "Log Out", Icon: LogOut },
];

const ADMIN: Item[] = [
	{ href: "/admin/stok", match: "/admin/stok", label: "Stok", Icon: Boxes },
	{ href: "/admin/produk", match: "/admin/produk", label: "Produk", Icon: Package },
	{ href: "/admin/laporan", match: "/admin/laporan", label: "Laporan", Icon: BarChart3 },
	{ href: "/admin/akun", match: "/admin/akun", label: "Akun", Icon: ShieldCheck },
	{ href: "/admin/logout", match: "/admin/logout", label: "Log Out", Icon: LogOut, desktopOnly: true },
];

function BottomNav({ items, label }: { items: Item[]; label: string }) {
	const pathname = usePathname();
	return (
		<nav
			aria-label={label}
			className="fixed inset-x-4 bottom-4 z-50 mx-auto flex h-[64px] max-w-[720px] items-center gap-1.5 rounded-[24px] border border-border bg-surface p-2 print:hidden lg:hidden"
		>
			{items
				.filter((i) => !i.desktopOnly)
				.map(({ href, match, label, Icon }) => {
					const aktif = pathname.startsWith(match);
					return (
						<Link
							key={label}
							href={href}
							aria-current={aktif ? "page" : undefined}
							className={`flex h-full flex-1 flex-col items-center justify-center gap-0.5 rounded-[18px] transition-colors ${
								aktif ? "bg-primary text-white" : "bg-bg text-primary outline outline-border -outline-offset-px"
							}`}
						>
							<Icon aria-hidden className="size-[18px]" strokeWidth={2} />
							<span className={`text-[9px] ${aktif ? "font-black" : "font-normal"}`}>{label}</span>
						</Link>
					);
				})}
		</nav>
	);
}

/** Shell Kasir: nav horizontal di atas (desktop) + bottom nav (mobile). Tanpa item Admin sama sekali. */
export function KasirShell({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	return (
		<div className="min-h-dvh bg-bg pb-[92px] lg:pb-0">
			<div className="mx-auto hidden w-full max-w-[1440px] px-10 pt-10 print:hidden lg:block">
				<nav aria-label="Navigasi kasir" className="flex h-[64px] w-full items-center gap-2 rounded-[24px] border border-border bg-surface p-2">
					{KASIR.map(({ href, match, label, Icon }) => {
						const aktif = pathname.startsWith(match);
						return (
							<Link
								key={label}
								href={href}
								aria-current={aktif ? "page" : undefined}
								className={`flex h-full flex-1 items-center justify-center gap-2 rounded-[18px] text-[13px]/[15px] font-black transition-colors ${
									aktif ? "bg-primary text-white" : "bg-bg text-primary outline outline-border -outline-offset-px hover:bg-border/40"
								}`}
							>
								<Icon aria-hidden className="size-[17px]" strokeWidth={2} />
								{label}
							</Link>
						);
					})}
				</nav>
			</div>
			<div className="mx-auto w-full max-w-[760px] lg:max-w-[1440px] lg:px-10 lg:pb-10">{children}</div>
			<BottomNav items={KASIR} label="Navigasi kasir" />
		</div>
	);
}

/** Shell Admin: sidebar kiri (desktop) + bottom nav (mobile). Tanpa item transaksi Kasir sama sekali. */
export function AdminShell({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	return (
		<div className="min-h-dvh bg-bg pb-[92px] lg:flex lg:pb-0">
			<aside className="sticky top-0 hidden h-dvh w-[260px] shrink-0 flex-col gap-6 border-r border-border bg-surface p-6 print:hidden lg:flex">
				<p className="text-[28px]/[33px] font-black text-primary">
					Dapur Ina
					<br />
					Aina
				</p>
				<nav aria-label="Navigasi admin" className="flex flex-col gap-2.5">
					{ADMIN.map(({ href, match, label, Icon }) => {
						const aktif = pathname.startsWith(match);
						return (
							<Link
								key={label}
								href={href}
								aria-current={aktif ? "page" : undefined}
								className={`flex h-[46px] items-center gap-3 rounded-[16px] px-4 text-[14px] transition-colors ${
									aktif ? "bg-primary font-semibold text-white" : "text-primary hover:bg-bg"
								}`}
							>
								<Icon aria-hidden className="size-[18px]" strokeWidth={1.75} />
								{label}
							</Link>
						);
					})}
				</nav>
			</aside>
			<div className="mx-auto w-full min-w-0 max-w-[760px] flex-1 lg:mx-0 lg:max-w-none lg:px-10 lg:pb-10">{children}</div>
			<BottomNav items={ADMIN} label="Navigasi admin" />
		</div>
	);
}
