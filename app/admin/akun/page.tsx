import Link from "next/link";
import { CircleCheck, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { wajibPeran } from "@/lib/auth";
import { getJumlahAkun } from "@/lib/data";

const AKSES = [
	{ judul: "Kasir", desc: "Buat pesanan, bayar, cetak struk", kunci: "kasir" },
	{ judul: "Administrator", desc: "Produk, stok, laporan", kunci: "administrator" },
	{ judul: "Pelanggan", desc: "Konseptual / walk-in tanpa login", kunci: null },
] as const;

const KEAMANAN = [
	["Supabase Auth aktif", "Login email & kata sandi"],
	["Akses per peran", "Dicek di middleware dan di server"],
	["Audit kasir", "Transaksi menyimpan id kasir"],
] as const;

export default async function AdminAkunPage() {
	const [sesi, jumlah] = await Promise.all([wajibPeran("administrator"), getJumlahAkun()]);

	return (
		<main className="flex w-full flex-col gap-3.5 px-4 pb-6 pt-5 lg:mx-auto lg:max-w-[640px] lg:gap-4 lg:px-0 lg:pt-10">
			<PageHeader judul="Admin Akun" subjudul="Peran pengguna dan keamanan" Icon={ShieldCheck} gelap subjudulDesktop="Peran pengguna dan keamanan" />

			<div className="flex w-full shrink-0 items-center gap-3 rounded-[28px] bg-primary p-4">
				<div className="flex size-14 shrink-0 items-center justify-center rounded-[20px] bg-white/10">
					<UserRound aria-hidden className="size-5 text-white" strokeWidth={2} />
				</div>
				<div className="flex min-w-0 flex-1 flex-col gap-[3px]">
					<p className="truncate font-heading text-[18px] font-black text-white">{sesi.nama}</p>
					<p className="truncate text-[11px] font-bold text-[#D8D4CE]">administrator • {sesi.email}</p>
				</div>
			</div>

			<div className="flex w-full flex-col gap-2">
				{AKSES.map((a) => (
					<div key={a.judul} className="flex h-[72px] w-full shrink-0 items-center gap-2.5 rounded-[22px] border border-border bg-surface p-3.5">
						<div className="flex min-w-0 flex-1 flex-col gap-[3px]">
							<p className="truncate text-[14px]/[17px] font-black text-primary">{a.judul}</p>
							<p className="truncate text-[11px]/[13px] font-semibold text-muted">{a.desc}</p>
						</div>
						<span className="rounded-[99px] bg-bg px-2.5 py-1.5 text-[10px]/[12px] font-black text-primary">{a.kunci ? jumlah[a.kunci] : 0} akun</span>
					</div>
				))}
			</div>

			<div className="flex w-full shrink-0 flex-col gap-2 rounded-[26px] border border-border bg-surface p-4">
				<p className="text-[15px]/[18px] font-black text-primary">Keamanan</p>
				{KEAMANAN.map(([label, desc]) => (
					<div key={label} className="flex w-full items-center gap-2">
						<CircleCheck aria-hidden className="size-5 shrink-0 text-success" strokeWidth={2} />
						<div className="flex min-w-0 flex-1 flex-col gap-[2px]">
							<p className="truncate text-[12px]/[14px] font-black text-primary">{label}</p>
							<p className="truncate text-[10px]/[12px] font-semibold text-muted">{desc}</p>
						</div>
					</div>
				))}
			</div>

			<Link href="/admin/logout" className="flex h-[52px] w-full shrink-0 items-center justify-center gap-2 rounded-[99px] bg-primary text-[13px] font-black text-white transition-opacity hover:opacity-90 lg:hidden">
				<LogOut aria-hidden className="size-[17px]" strokeWidth={2} />
				Log Out
			</Link>
		</main>
	);
}
