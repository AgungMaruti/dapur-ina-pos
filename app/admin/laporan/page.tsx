import Link from "next/link";
import { FileSpreadsheet, ShieldCheck, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PrintButton } from "@/components/print-button";
import { getTransaksiLunas } from "@/lib/data";
import { formatRupiah, formatWaktu } from "@/lib/format";
import { agregasiLaporan, awalBulan, type Periode } from "@/lib/laporan";

export default async function AdminLaporanPage({ searchParams }: { searchParams: Promise<{ periode?: string }> }) {
	const periode: Periode = (await searchParams).periode === "minggu" ? "minggu" : "bulan";
	const now = new Date();
	// 6 bulan ke belakang + bulan ini = 7 batang grafik bulanan; sekaligus mencakup minggu lalu
	const r = agregasiLaporan(await getTransaksiLunas(awalBulan(now, 6).toISOString()), periode, now);

	const noun = periode === "minggu" ? "minggu" : "bulan";
	const persen = r.persen === null ? null : `${r.persen >= 0 ? "+" : ""}${r.persen}%`;
	const maks = Math.max(...r.bars.map((b) => b.total), 1);
	const ada = r.bars.filter((b) => b.total > 0);
	const rata = ada.length ? ada.reduce((s, b) => s + b.total, 0) / ada.length : 0;

	const tombolExport = "flex h-[52px] items-center gap-2 rounded-[18px] border border-border bg-surface px-5 text-[13px] font-black text-primary transition-opacity hover:opacity-80";

	return (
		<main className="flex w-full flex-col gap-3.5 px-4 pb-6 pt-5 lg:gap-5 lg:px-0 lg:pt-10">
			<PageHeader
				judul="Admin Laporan"
				subjudul="Ringkasan mingguan dan bulanan"
				judulDesktop="Laporan Penjualan"
				subjudulDesktop="Dihitung langsung dari transaksi lunas."
				Icon={ShieldCheck}
				gelap
			/>

			<div className="flex w-full items-center justify-between gap-3 print:hidden">
				<div className="flex w-full gap-2 rounded-[18px] border border-border bg-surface p-[5px] lg:w-auto lg:rounded-[20px]">
					{(["minggu", "bulan"] as const).map((p) => (
						<Link
							key={p}
							href={`/admin/laporan?periode=${p}`}
							aria-current={p === periode ? "page" : undefined}
							className={`flex h-9 min-w-0 flex-1 items-center justify-center rounded-[14px] text-[12px] font-extrabold transition-colors lg:h-11 lg:flex-none lg:px-6 lg:text-[13px] ${p === periode ? "bg-primary text-white" : "text-muted hover:text-primary"}`}
						>
							{p === "minggu" ? "Mingguan" : "Bulanan"}
						</Link>
					))}
				</div>
				<div className="hidden gap-3 lg:flex">
					<a href={`/admin/laporan/export?periode=${periode}`} className="flex h-[52px] items-center gap-2 rounded-[18px] bg-primary px-5 text-[13px] font-black text-white transition-opacity hover:opacity-90">
						<FileSpreadsheet aria-hidden className="size-[18px]" strokeWidth={2} />
						Export Excel
					</a>
					<PrintButton className={tombolExport} />
				</div>
			</div>

			{/* Ringkasan */}
			<div className="hidden grid-cols-3 gap-5 lg:grid">
				{[
					[`Total ${noun === "bulan" ? "Bulan" : "Minggu"} Ini`, formatRupiah(r.total)],
					["Transaksi Lunas", String(r.jumlah)],
					["Rata-rata / Hari", formatRupiah(r.rataRata)],
				].map(([label, nilai]) => (
					<div key={label} className="flex flex-col gap-2 rounded-[28px] border border-border bg-surface px-6 py-5">
						<p className="text-[13px] font-bold text-muted">{label}</p>
						<p className="font-heading text-[36px]/[42px] font-black text-primary">{nilai}</p>
					</div>
				))}
			</div>
			<div className="flex w-full flex-col gap-2.5 rounded-[28px] bg-primary p-[18px] lg:hidden">
				<p className="text-[12px]/[14px] font-bold text-bg">Total penjualan {noun} ini</p>
				<p className="font-heading text-[32px] font-black text-white">{formatRupiah(r.total)}</p>
				<p className="text-[12px]/[14px] font-bold text-[#D8D4CE]">
					{persen ? `${persen} dari ${noun} lalu • ` : ""}
					{r.jumlah} transaksi lunas
				</p>
			</div>

			{/* Grafik */}
			<div className="relative flex h-[170px] w-full items-stretch gap-2 rounded-[24px] border border-border bg-surface p-3 lg:h-[400px] lg:gap-6 lg:rounded-[30px] lg:p-8">
				{r.bars.map((b, i) => (
					<div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-[7px]">
						<div className="flex w-full flex-1 items-end">
							<div
								title={formatRupiah(b.total)}
								className={`w-full rounded-t-[8px] rounded-b-[2px] lg:rounded-t-[16px] ${b.total > 0 && b.total >= rata ? "bg-primary" : "bg-[#C8C2B9]"}`}
								style={{ height: `${Math.max(3, (b.total / maks) * 100)}%` }}
							/>
						</div>
						<span className="text-[10px]/[12px] font-extrabold text-muted lg:text-[13px]">{b.label}</span>
					</div>
				))}
				{persen ? (
					<span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-[99px] bg-success px-2.5 py-1.5 lg:hidden">
						<TrendingUp aria-hidden className="size-[13px] text-white" strokeWidth={2.5} />
						<span className="text-[11px] font-black text-white">{persen}</span>
					</span>
				) : null}
			</div>

			{/* Rincian transaksi */}
			{r.terbaru.length === 0 ? (
				<div className="rounded-[24px] border border-border bg-surface px-4 py-10 text-center text-[13px] font-bold text-muted">Belum ada transaksi lunas {noun} ini</div>
			) : (
				<div className="flex w-full flex-col overflow-hidden rounded-[24px] border border-border bg-surface lg:rounded-[30px]">
					<p className="hidden px-6 pb-1 pt-5 text-[15px] font-black text-primary lg:block">Transaksi terbaru</p>
					{r.terbaru.slice(0, 5).map((t) => (
						<div key={t.id} className="flex h-[52px] w-full shrink-0 items-center justify-between gap-3 px-3.5 lg:h-16 lg:px-6">
							<div className="flex min-w-0 flex-col gap-[2px]">
								<p className="text-[12px]/[14px] font-black text-primary lg:text-[14px]">TRX-{t.id.slice(0, 8).toUpperCase()}</p>
								<p className="truncate text-[10px]/[12px] font-semibold text-muted lg:text-[12px]">
									{t.nama || "Walk-in"} • {formatWaktu(t.tanggal)}
								</p>
							</div>
							<p className="whitespace-nowrap text-[12px]/[14px] font-black text-primary lg:text-[14px]">{formatRupiah(t.total)}</p>
						</div>
					))}
				</div>
			)}
		</main>
	);
}
