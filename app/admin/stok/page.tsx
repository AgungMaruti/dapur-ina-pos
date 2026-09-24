import Link from "next/link";
import { Download, PackageCheck, Plus, ShieldCheck, TrendingUp, TriangleAlert, ReceiptText } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ubahStok } from "@/lib/actions";
import { getProduk, getTransaksiLunas } from "@/lib/data";
import { formatRupiah, formatRupiahK, statusStok, type StatusStok } from "@/lib/format";
import { awalBulan, persenNaik, ringkasHariIni } from "@/lib/laporan";

const PILL: Record<StatusStok, { label: string; cls: string }> = {
	tersedia: { label: "Tersedia", cls: "bg-success" },
	menipis: { label: "Menipis", cls: "bg-warning" },
	habis: { label: "Habis", cls: "bg-primary" },
};

const delta = (p: number | null) => (p === null ? "—" : `${p >= 0 ? "+" : ""}${p}%`);

function Metrik({ label, nilai, Icon, warna = "text-primary" }: { label: string; nilai: string | number; Icon: typeof TrendingUp; warna?: string }) {
	return (
		<div className="flex h-[116px] min-w-0 flex-1 flex-col gap-2 rounded-[24px] border border-border bg-surface p-3.5 lg:h-[124px] lg:p-4">
			<div className="flex w-full items-center justify-between">
				<p className="text-[11px]/[13px] font-bold text-muted lg:text-[13px]">{label}</p>
				<span className="flex size-[34px] shrink-0 items-center justify-center rounded-[12px] bg-[#1717170F] lg:bg-transparent">
					<Icon aria-hidden className={`size-5 ${warna}`} strokeWidth={2} />
				</span>
			</div>
			<p className={`whitespace-nowrap font-heading text-[25px]/[30px] font-black lg:text-[36px]/[42px] ${warna}`}>{nilai}</p>
		</div>
	);
}

export default async function AdminStokPage() {
	const now = new Date();
	const [produk, trx] = await Promise.all([getProduk(), getTransaksiLunas(awalBulan(now, 1).toISOString())]);
	const r = ringkasHariIni(trx, now);
	const tersedia = produk.filter((p) => p.jumlah > 0).length;
	const menipis = produk.filter((p) => statusStok(p.jumlah) === "menipis").length;
	const aman = produk.filter((p) => statusStok(p.jumlah) === "tersedia").length;

	const tabel = (
		<div className="flex w-full flex-col overflow-hidden rounded-[26px] border border-border bg-surface lg:rounded-[30px]">
			<div className="flex h-[46px] shrink-0 items-center gap-2 bg-[#EFEBE5] px-3.5 text-[11px] font-black text-muted lg:h-[64px] lg:px-4 xl:px-6 lg:text-[13px]">
				<p className="min-w-0 flex-1">Produk</p>
				<p className="w-[48px] shrink-0 lg:w-[56px] xl:w-[100px]">Qty</p>
				<p className="w-[82px] shrink-0 lg:w-[92px] xl:w-[140px]">Status</p>
				<p className="w-[40px] shrink-0 lg:w-[44px] xl:w-[60px]">Aksi</p>
			</div>
			{produk.length === 0 ? (
				<p className="px-4 py-10 text-center text-[13px] font-bold text-muted">
					Belum ada produk. <Link href="/admin/produk" className="underline">Tambah produk</Link>
				</p>
			) : (
				produk.map((p) => {
					const s = PILL[statusStok(p.jumlah)];
					return (
						<div key={p.id} className="flex h-[56px] w-full items-center gap-2 border-b border-border px-3.5 last:border-b-0 lg:h-[80px] lg:px-4 xl:px-6">
							<p className="min-w-0 flex-1 truncate text-[12px] text-primary lg:text-[16px]">{p.nama_produk}</p>
							<p className="w-[48px] shrink-0 text-[13px] font-black tabular-nums text-primary lg:w-[56px] xl:w-[100px] lg:text-[16px]">{p.jumlah}</p>
							<span className={`flex h-[26px] w-[82px] shrink-0 items-center justify-center rounded-[99px] text-[10px] font-black text-white lg:h-10 lg:w-[92px] xl:w-[140px] lg:text-[13px] ${s.cls}`}>{s.label}</span>
							<form action={ubahStok.bind(null, p.id, 1)} className="shrink-0">
								<button type="submit" aria-label={`Tambah stok ${p.nama_produk}`} className="flex h-[32px] w-[40px] items-center justify-center rounded-[12px] bg-bg text-primary transition-opacity hover:opacity-70 lg:h-10 lg:w-[44px] xl:w-[60px]">
									<Plus aria-hidden className="size-3.5 lg:size-4" strokeWidth={2.5} />
								</button>
							</form>
						</div>
					);
				})
			)}
		</div>
	);

	return (
		<main className="flex w-full flex-col gap-4 px-4 pb-6 pt-5 lg:gap-5 lg:px-0 lg:pt-10">
			<PageHeader
				judul="Admin Dashboard"
				subjudul="Kelola produk, stok, dan laporan"
				subjudulDesktop="Pantau stok dan penjualan restoran."
				Icon={ShieldCheck}
				gelap
				aksi={
					<span className="flex h-12 items-center gap-2 rounded-[99px] bg-primary px-5 text-[13px] font-black text-white">
						<ShieldCheck aria-hidden className="size-5" strokeWidth={2} />
						MODE ADMIN
					</span>
				}
			/>

			{/* Metrik atas */}
			<div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-5">
				<Metrik label="Penjualan Hari Ini" nilai={formatRupiahK(r.hari.total)} Icon={TrendingUp} />
				<Metrik label="Produk Tersedia" nilai={tersedia} Icon={PackageCheck} warna="text-success" />
				<div className="hidden lg:contents">
					<Metrik label="Stok Menipis" nilai={menipis} Icon={TriangleAlert} warna={menipis ? "text-warning" : "text-primary"} />
					<Metrik label="Transaksi Lunas" nilai={r.hari.jumlah} Icon={ReceiptText} />
				</div>
			</div>

			{/* Tab mobile */}
			<div className="flex w-full items-start gap-2 lg:hidden">
				{[["Stok", "/admin/stok"], ["Produk", "/admin/produk"], ["Laporan", "/admin/laporan"]].map(([label, href]) => (
					<Link key={label} href={href} aria-current={label === "Stok" ? "page" : undefined} className={`rounded-[99px] px-3 py-2 text-[12px] font-bold ${label === "Stok" ? "bg-primary text-white" : "bg-surface text-muted outline outline-border -outline-offset-px"}`}>
						{label}
					</Link>
				))}
			</div>

			<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-5">
				<div className="min-w-0 flex-1">{tabel}</div>

				{/* Kartu samping desktop */}
				<div className="hidden w-[240px] shrink-0 xl:w-[300px] flex-col gap-4 lg:flex">
					{[
						["Penjualan", formatRupiahK(r.hari.total), delta(persenNaik(r.hari.total, r.kemarin.total))],
						["Lunas", String(r.hari.jumlah), delta(persenNaik(r.hari.jumlah, r.kemarin.jumlah))],
						["Stok aman", String(aman), produk.length ? `${Math.round((aman / produk.length) * 100)}%` : "—"],
					].map(([label, nilai, sub]) => (
						<div key={label} className="flex flex-col gap-1.5 rounded-[26px] border border-border bg-surface p-5">
							<p className="text-[13px] font-bold text-muted">{label}</p>
							<p className="font-heading text-[34px]/[40px] font-black text-primary">{nilai}</p>
							<p className={`text-[13px] font-black ${sub.startsWith("-") ? "text-danger" : "text-success"}`}>{sub}</p>
						</div>
					))}
				</div>
			</div>

			{/* Laporan bulanan mobile */}
			<div className="flex h-[92px] w-full shrink-0 items-center justify-between gap-2.5 rounded-[24px] border border-border bg-primary p-3.5 lg:hidden">
				<div className="flex min-w-0 flex-col gap-[3px]">
					<p className="text-[13px]/[15px] font-bold text-bg">Laporan Bulanan</p>
					<p className="truncate font-heading text-[24px]/[28px] font-black text-white">{formatRupiah(r.bulan)}</p>
				</div>
				<a href="/admin/laporan/export?periode=bulan" className="flex h-fit shrink-0 items-center gap-1.5 rounded-[99px] bg-warning px-[13px] py-2.5 text-white transition-opacity hover:opacity-85">
					<Download aria-hidden className="size-5" strokeWidth={2} />
					<span className="text-[12px]/[14px] font-extrabold">Export</span>
				</a>
			</div>
		</main>
	);
}
