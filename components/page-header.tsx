import type { LucideIcon } from "lucide-react";
import { UserRound } from "lucide-react";

/**
 * Header halaman: kartu ringkas di mobile, judul besar di desktop.
 * `aksi` = slot kanan desktop (pencarian, tombol).
 */
export function PageHeader({
	judul,
	subjudul,
	judulDesktop = judul,
	subjudulDesktop = subjudul,
	Icon = UserRound,
	gelap = false,
	aksi,
}: {
	judul: string;
	subjudul: string;
	judulDesktop?: string;
	subjudulDesktop?: string;
	Icon?: LucideIcon;
	/** ikon di kotak hitam (gaya admin) vs lingkaran outline (gaya kasir) */
	gelap?: boolean;
	aksi?: React.ReactNode;
}) {
	return (
		<>
			<header className="flex w-full items-center justify-between gap-3 rounded-[24px] border border-border bg-surface p-3 lg:hidden">
				<div className="flex min-w-0 flex-col gap-[3px]">
					<h1 className="truncate font-heading text-[23px]/[27px] font-extrabold text-primary">{judul}</h1>
					<p className="truncate text-[12px]/[14px] font-medium text-muted">{subjudul}</p>
				</div>
				<div
					className={`flex size-11 shrink-0 items-center justify-center ${
						gelap ? "rounded-[16px] bg-primary text-white" : "rounded-[99px] border border-border bg-surface text-primary"
					}`}
				>
					<Icon aria-hidden className="size-5" strokeWidth={2} />
				</div>
			</header>
			<header className="hidden w-full items-center justify-between gap-6 lg:flex">
				<div className="flex flex-col gap-1">
					<h1 className="whitespace-nowrap text-[36px]/[42px] font-black text-primary">{judulDesktop}</h1>
					<p className="text-[15px]/[18px] font-semibold text-muted">{subjudulDesktop}</p>
				</div>
				{aksi}
			</header>
		</>
	);
}

export function Kosong({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex flex-col items-center gap-3 rounded-[28px] border border-border bg-surface p-8 text-center text-[14px] font-semibold text-muted">
			{children}
		</div>
	);
}

export const tombolGelap =
	"inline-flex h-11 items-center justify-center gap-2 rounded-[99px] bg-primary px-6 text-[13px]/[15px] font-black text-white transition-opacity hover:opacity-90";
