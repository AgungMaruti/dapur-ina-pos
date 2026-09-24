import Link from "next/link";
import { ReceiptText } from "lucide-react";
import { Kosong, tombolGelap } from "@/components/page-header";
import { StrukActions } from "@/components/struk-actions";
import { getStruk } from "@/lib/data";
import { formatRupiah, formatWaktu } from "@/lib/format";

const Baris = ({ label, nilai, kecil = false }: { label: string; nilai: string; kecil?: boolean }) => (
	<div className="flex w-full items-start justify-between gap-3">
		<span className={`${kecil ? "text-[11px]/[13px]" : "text-[12px]/[14px]"} font-bold text-muted`}>{label}</span>
		<span className={`${kecil ? "text-[11px]/[13px]" : "text-[12px]/[14px]"} text-right font-black text-primary`}>{nilai}</span>
	</div>
);

export default async function KasirStrukPage({ params }: { params: Promise<{ id: string }> }) {
	const r = await getStruk((await params).id);

	if (!r) {
		return (
			<div className="p-5 lg:p-0 lg:pt-[18px]">
				<Kosong>
					<div className="flex size-12 items-center justify-center rounded-[16px] bg-primary">
						<ReceiptText aria-hidden className="size-5 text-white" strokeWidth={2} />
					</div>
					<p className="text-[18px]/[22px] font-black text-primary">Struk tidak ditemukan</p>
					<p>Belum ada transaksi lunas dengan ID tersebut.</p>
					<Link href="/kasir/menu?category=makanan" className={tombolGelap}>
						Buka Menu
					</Link>
				</Kosong>
			</div>
		);
	}

	const nama = r.nama_pelanggan || "Tanpa nama";
	const tunai = r.metode === "tunai";

	return (
		<div className="flex flex-col gap-3.5 p-5 lg:min-h-[640px] lg:flex-row lg:items-center lg:justify-center lg:gap-[30px] lg:p-0">
			{/* Kertas struk — satu markup, mobile & desktop */}
			<section aria-label="Kertas struk" className="flex w-full flex-col gap-3 rounded-[28px] border border-border bg-surface p-[18px] shadow-[0px_14px_32px_0px_#17171716] print:border-0 print:shadow-none lg:w-[520px] lg:shrink-0 lg:gap-3.5 lg:rounded-[30px] lg:p-[30px] lg:shadow-[0px_20px_40px_0px_#17171718]">
				<p className="text-[22px]/[26px] font-black text-primary lg:text-[28px]/[33px]">Dapur Ina Aina</p>
				<p className="text-[12px]/[14px] font-bold text-muted lg:text-[13px]/[15px]">
					{r.kode} • {nama} • Lunas
				</p>
				<div className="h-px w-full bg-border" />
				<Baris kecil label="Kasir" nilai={r.kasir} />
				<Baris kecil label="Waktu" nilai={formatWaktu(r.tanggal)} />
				<div className="h-px w-full bg-border" />
				{r.items.map((i, n) => (
					<div key={n} className="flex w-full items-start justify-between gap-3">
						<div className="flex min-w-0 flex-col gap-0.5">
							<span className="text-[13px]/[15px] font-extrabold text-primary lg:text-[15px]/[18px]">
								{i.nama} x{i.jumlah}
							</span>
							<span className="text-[10px]/[12px] font-semibold text-muted lg:hidden">
								{i.jumlah} x {i.harga.toLocaleString("id-ID")}
							</span>
						</div>
						<span className="whitespace-nowrap text-[13px]/[15px] font-black text-primary lg:text-[15px]/[18px]">{formatRupiah(i.subtotal)}</span>
					</div>
				))}
				<div className="h-px w-full bg-border" />
				{tunai ? (
					<>
						<Baris label="Tunai" nilai={formatRupiah(r.jumlah_bayar)} />
						<Baris label="Kembalian" nilai={formatRupiah(r.kembalian ?? 0)} />
					</>
				) : (
					<>
						<Baris label="Metode" nilai="Non-tunai (QR)" />
						<Baris label="Ref" nilai={r.nomor_referensi ?? "-"} />
					</>
				)}
				<div className="flex h-[58px] w-full items-center justify-between rounded-[20px] bg-primary p-3.5 print:border print:border-primary print:bg-white lg:h-[70px] lg:rounded-[22px] lg:p-[18px]">
					<span className="text-[13px]/[15px] font-extrabold text-white print:text-primary lg:text-[16px]/[19px]">Total</span>
					<span className="whitespace-nowrap text-[20px]/[24px] font-black text-white print:text-primary lg:text-[28px]/[33px]">{formatRupiah(r.total)}</span>
				</div>
			</section>

			<aside className="flex w-full flex-col gap-3.5 lg:w-[360px] lg:shrink-0">
				<div className="hidden flex-col gap-3.5 lg:flex print:hidden">
					<h1 className="text-[32px]/[38px] font-black text-primary">Struk siap diproses</h1>
					<p className="text-[15px]/[18px] font-semibold text-muted">Cetak struk untuk pelanggan atau bagikan sebagai bukti transaksi digital.</p>
				</div>
				<div className="lg:hidden print:hidden">
					<StrukActions struk={r} />
				</div>
				<div className="hidden lg:block print:hidden">
					<StrukActions struk={r} besar labelBagikan="Bagikan" />
				</div>
				<Link href="/kasir/menu?category=makanan" className="flex h-12 w-full items-center justify-center rounded-[99px] border border-border bg-surface text-[13px]/[15px] font-black text-muted transition-opacity hover:opacity-80 print:hidden">
					Pesanan Baru
				</Link>
			</aside>
		</div>
	);
}
