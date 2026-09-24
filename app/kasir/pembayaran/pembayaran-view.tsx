"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeDollarSign, Banknote, CircleCheck, QrCode, ReceiptText, ScanLine, UserRound } from "lucide-react";
import { Kosong, PageHeader, tombolGelap } from "@/components/page-header";
import { bayar } from "@/lib/actions";
import { gabung, kosongkan, useCart } from "@/lib/cart-store";
import { formatAngka, formatRupiah, hitungKembalian, parseAngka } from "@/lib/format";
import type { MetodeBayar, ProdukView } from "@/lib/types";

/** Pola QR ilustrasi (BUKAN payment gateway; PRD: non tunai = catat referensi EDC manual). */
function QrDemo({ size }: { size: number }) {
	const N = 25;
	const finder = (x: number, y: number) => [[0, 0], [N - 7, 0], [0, N - 7]].some(([fx, fy]) => x >= fx - 1 && x <= fx + 7 && y >= fy - 1 && y <= fy + 7);
	const rects: React.ReactNode[] = [];
	for (let y = 0; y < N; y++)
		for (let x = 0; x < N; x++)
			if (!finder(x, y) && (x * 7 + y * 13 + x * y) % 5 < 2) rects.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />);
	return (
		<svg aria-hidden viewBox={`-2 -2 ${N + 4} ${N + 4}`} width={size} height={size} className="shrink-0 rounded-[24px] border border-border bg-surface p-3">
			<g fill="#171717">
				{rects}
				{[[0, 0], [N - 7, 0], [0, N - 7]].map(([x, y]) => (
					<g key={`${x}${y}`}>
						<rect x={x} y={y} width="7" height="7" />
						<rect x={x + 1} y={y + 1} width="5" height="5" fill="#fff" />
						<rect x={x + 2} y={y + 2} width="3" height="3" />
					</g>
				))}
			</g>
		</svg>
	);
}

function usePembayaran(produk: ProdukView[]) {
	const router = useRouter();
	const cart = useCart();
	const { lines, total } = gabung(cart.items, produk);
	const [uangRaw, setUangRaw] = useState("");
	const [referensi, setReferensi] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [proses, mulai] = useTransition();
	const uang = parseAngka(uangRaw);
	const kembalian = uang > 0 ? hitungKembalian(uang, total) : null;
	const ada = lines.length > 0;

	function kirim(metode: MetodeBayar) {
		setError(null);
		mulai(async () => {
			const r = await bayar({ items: cart.items, nama: cart.nama, metode, uangDiterima: uang, referensi });
			if (!r.ok) return setError(r.error);
			kosongkan();
			router.push(`/kasir/struk/${r.id}`);
		});
	}

	return {
		cart, lines, total, uang, kembalian, error, proses, referensi, setReferensi, kirim,
		uangRaw, setUang: (v: string) => setUangRaw(formatAngka(parseAngka(v))),
		bisaTunai: ada && kembalian !== null && !proses,
		bisaQr: ada && !proses,
	};
}
type Bayar = ReturnType<typeof usePembayaran>;

function UangInput({ b, id }: { b: Bayar; id: string }) {
	return (
		<>
			<label htmlFor={id} className="text-[13px]/[15px] font-extrabold text-muted">
				Uang diterima
			</label>
			<div className="flex h-[58px] w-full items-center justify-between rounded-[20px] bg-bg px-3.5 outline outline-primary -outline-offset-px">
				<span className="text-[14px]/[17px] font-black text-primary">Rp</span>
				<input
					id={id}
					inputMode="numeric"
					autoComplete="off"
					placeholder="0"
					value={b.uangRaw}
					onChange={(e) => b.setUang(e.target.value)}
					className="min-w-0 flex-1 bg-transparent text-right font-heading text-[26px]/[31px] font-black text-primary outline-none placeholder:text-muted/60"
				/>
			</div>
			{b.uang > 0 && b.kembalian === null ? (
				<p role="alert" className="text-[12px] font-bold text-danger">
					Uang diterima kurang dari total tagihan.
				</p>
			) : null}
		</>
	);
}

const ReferensiInput = ({ b }: { b: Bayar }) => (
	<input
		value={b.referensi}
		onChange={(e) => b.setReferensi(e.target.value)}
		maxLength={50}
		placeholder="No. referensi EDC (opsional)"
		aria-label="Nomor referensi"
		className="h-11 w-full rounded-[16px] border border-border bg-bg px-3.5 text-center text-[13px] font-bold text-primary outline-none placeholder:font-semibold placeholder:text-muted"
	/>
);

const Galat = ({ pesan }: { pesan: string | null }) =>
	pesan ? (
		<p role="alert" className="rounded-[18px] border border-danger/40 bg-danger/10 px-3 py-2 text-[12px] font-bold text-danger">
			{pesan}
		</p>
	) : null;

const tabMobile = (aktif: boolean) => `rounded-[99px] px-3 py-2 text-[12px] font-extrabold ${aktif ? "bg-primary text-white" : "bg-surface text-muted"}`;
const tabDesktop = (aktif: boolean) =>
	`flex h-[52px] flex-1 items-center justify-center gap-2 rounded-[18px] border border-border text-[13px]/[15px] font-black transition-colors ${aktif ? "bg-primary text-white" : "bg-surface text-primary hover:bg-bg"}`;
const tombolLunas = "flex w-full items-center justify-center gap-2 rounded-[99px] bg-success text-[14px]/[17px] font-black text-white transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50";

export function PembayaranView({ produk, qr }: { produk: ProdukView[]; qr: boolean }) {
	const b = usePembayaran(produk);
	const nama = b.cart.nama.trim() || "Tanpa nama";

	if (b.lines.length === 0) {
		return (
			<div className="flex flex-col gap-4 p-5 lg:gap-[18px] lg:p-0 lg:pt-[18px]">
				<PageHeader judul="Pembayaran" subjudul="Tagihan kosong" />
				<Kosong>
					<p>Belum ada tagihan. Pilih menu dulu.</p>
					<Link href="/kasir/menu?category=makanan" className={tombolGelap}>
						Buka Menu
					</Link>
				</Kosong>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4 p-5 lg:gap-[18px] lg:p-0 lg:pt-[18px]">
			{/* ---------------- Mobile ---------------- */}
			<div className="flex flex-col gap-4 lg:hidden">
				<PageHeader judul={qr ? "Kasir Bayar" : "Kasir Tunai"} subjudul={qr ? "Scan QR demo atau tandai lunas" : "Input uang diterima dan cek kembalian"} />
				<div className="flex h-[38px] w-full items-center justify-between rounded-[18px] bg-primary px-2.5">
					<span className="flex items-center gap-[7px] text-[12px] font-black text-white">
						{qr ? <BadgeDollarSign aria-hidden className="size-4" /> : <Banknote aria-hidden className="size-5" />}
						Mode Kasir
					</span>
					<span className="rounded-[99px] bg-white/10 px-2.5 py-1.5 text-[11px] font-extrabold text-bg">{qr ? "QR" : "Tunai"}</span>
				</div>

				<section aria-label="Tagihan" className="flex w-full flex-col gap-3 rounded-[28px] border border-border bg-surface p-4 shadow-[0px_10px_25px_0px_#6B3D2612]">
					<div className="flex items-start justify-between">
						<span className="text-[14px]/[17px] font-extrabold text-primary">{nama}</span>
						<span className={`text-[12px]/[14px] font-extrabold ${qr ? "text-warning" : "text-primary"}`}>{qr ? "Menunggu bayar" : "Tunai"}</span>
					</div>
					<div className="flex items-end justify-between">
						<span className="text-[13px]/[15px] font-semibold text-muted">Total tagihan</span>
						<span className="font-heading text-[28px]/[33px] font-black text-primary">{formatRupiah(b.total)}</span>
					</div>
				</section>

				<div className="flex w-full gap-2">
					<Link href="/kasir/pembayaran?method=tunai" className={tabMobile(!qr)}>Tunai</Link>
					<Link href="/kasir/pembayaran?method=qr" className={tabMobile(qr)}>QR Non Tunai</Link>
				</div>
				<Galat pesan={b.error} />

				{qr ? (
					<section aria-label="Pembayaran QR demo" className="flex w-full flex-col items-center gap-3.5 rounded-[30px] border border-border bg-surface p-[18px] shadow-[0px_16px_35px_0px_#6B3D261A]">
						<p className="w-full text-center text-[14px]/[17px] font-bold text-primary">Scan QR untuk simulasi pembayaran non tunai</p>
						<QrDemo size={244} />
						<ReferensiInput b={b} />
						<button type="button" disabled={!b.bisaQr} onClick={() => b.kirim("non_tunai")} className={`${tombolLunas} h-[52px]`}>
							<CircleCheck aria-hidden className="size-5" strokeWidth={2} />
							{b.proses ? "Memproses…" : "Tandai Lunas"}
						</button>
						<p className="w-full text-center text-[11px]/[13px] font-semibold text-muted">Gambar QR hanya demo, bukan payment gateway asli.</p>
					</section>
				) : (
					<section aria-label="Form pembayaran tunai" className="flex w-full flex-col gap-3 rounded-[30px] border border-border bg-surface p-[18px] shadow-[0px_16px_35px_0px_#6B3D261A]">
						<UangInput b={b} id="uang-m" />
						<div className={`flex h-[74px] w-full items-center justify-between rounded-[22px] p-3.5 outline -outline-offset-px ${b.kembalian !== null ? "bg-success/10 outline-success/25" : "bg-bg outline-border"}`}>
							<div className="flex flex-col gap-[3px]">
								<span className="text-[12px]/[14px] font-extrabold text-muted">Kembalian</span>
								<span className={`font-heading text-[24px]/[28px] font-black ${b.kembalian !== null ? "text-success" : "text-muted"}`}>
									{b.kembalian !== null ? formatRupiah(b.kembalian) : "—"}
								</span>
							</div>
							{b.kembalian !== null ? <CircleCheck aria-hidden className="size-5 text-success" strokeWidth={2} /> : null}
						</div>
						<button type="button" disabled={!b.bisaTunai} onClick={() => b.kirim("tunai")} className={`${tombolLunas} h-[52px]`}>
							<ReceiptText aria-hidden className="size-5" strokeWidth={2} />
							{b.proses ? "Memproses…" : "Bayar & Cetak Struk"}
						</button>
					</section>
				)}
				<p className="text-center text-[11px] font-bold text-muted">{b.lines.length} item dalam tagihan</p>
			</div>

			{/* ---------------- Desktop ---------------- */}
			<div className="hidden w-full gap-[22px] lg:flex">
				<section className="flex min-w-0 flex-1 flex-col gap-3.5 rounded-[30px] border border-border bg-surface p-[22px]">
					<h1 className="text-[34px]/[40px] font-black text-primary">Pembayaran</h1>
					<p className="text-[14px]/[17px] font-semibold text-muted">Review pesanan, pilih metode, lalu konfirmasi lunas.</p>

					<div className="flex h-[72px] w-full items-center gap-3 rounded-[22px] bg-bg p-3.5 outline outline-border -outline-offset-px">
						<UserRound aria-hidden className="size-5 shrink-0 text-primary" strokeWidth={2} />
						<div className="flex min-w-0 flex-1 flex-col gap-[3px]">
							<p className="truncate text-[16px]/[19px] font-black text-primary">{nama}</p>
							<p className="text-[12px]/[14px] font-bold text-muted">
								{b.lines.length} item • {qr ? "QR Non Tunai" : "Tunai"}
							</p>
						</div>
						<span className={`shrink-0 rounded-[99px] px-2.5 py-[7px] text-[11px]/[13px] font-black text-white ${qr ? "bg-warning" : "bg-primary"}`}>Menunggu</span>
					</div>

					<div className="flex w-full gap-3">
						<div className="flex min-w-0 flex-1 flex-col gap-[5px] rounded-[22px] bg-primary p-4">
							<span className="text-[12px]/[14px] font-extrabold text-white/80">Total</span>
							<span className="text-[24px]/[28px] font-black text-white">{formatRupiah(b.total)}</span>
						</div>
						<div className="flex min-w-0 flex-1 flex-col gap-[5px] rounded-[22px] border border-border bg-surface p-4">
							<span className="text-[12px]/[14px] font-extrabold text-muted">{qr ? "Metode" : "Tunai diterima"}</span>
							<span className="text-[24px]/[28px] font-black text-primary">{qr ? "Non tunai" : b.uang > 0 ? formatRupiah(b.uang) : "—"}</span>
						</div>
						<div className="flex min-w-0 flex-1 flex-col gap-[5px] rounded-[22px] border border-border bg-success/10 p-4">
							<span className="text-[12px]/[14px] font-extrabold text-muted">Kembalian</span>
							<span className="text-[24px]/[28px] font-black text-success">{!qr && b.kembalian !== null ? formatRupiah(b.kembalian) : "—"}</span>
						</div>
					</div>

					{qr ? null : (
						<div className="flex w-full flex-col gap-2.5">
							<UangInput b={b} id="uang-d" />
						</div>
					)}

					<div className="flex w-full gap-2.5">
						<Link href="/kasir/pembayaran?method=tunai" className={tabDesktop(!qr)}>
							<Banknote aria-hidden className="size-[17px]" strokeWidth={2} />
							Tunai
						</Link>
						<Link href="/kasir/pembayaran?method=qr" className={tabDesktop(qr)}>
							<QrCode aria-hidden className="size-[17px]" strokeWidth={2} />
							QR Non Tunai
						</Link>
					</div>
					<Galat pesan={b.error} />

					<div className="w-full overflow-hidden rounded-[22px] border border-border bg-surface">
						{b.lines.map((l) => (
							<div key={l.produk.id} className="flex h-[42px] items-center justify-between gap-2 px-3.5">
								<span className="truncate text-[12px]/[14px] font-extrabold text-primary">
									{l.produk.nama_produk} x{l.jumlah}
								</span>
								<span className="whitespace-nowrap text-[12px]/[14px] font-black text-primary">{formatRupiah(l.subtotal)}</span>
							</div>
						))}
					</div>

					<button type="button" disabled={qr ? !b.bisaQr : !b.bisaTunai} onClick={() => b.kirim(qr ? "non_tunai" : "tunai")} className={`${tombolLunas} h-[54px]`}>
						<CircleCheck aria-hidden className="size-[18px]" strokeWidth={2} />
						{b.proses ? "Memproses…" : "Konfirmasi Lunas"}
					</button>
				</section>

				<aside className="flex w-[360px] shrink-0 flex-col items-center gap-3.5 self-start rounded-[30px] border border-border bg-surface p-6">
					<h2 className="text-[22px]/[26px] font-black text-primary">QR Non Tunai</h2>
					<QrDemo size={260} />
					<ReferensiInput b={b} />
					<p className="w-full text-center text-[11px]/[13px] font-semibold text-muted">Gambar QR hanya demo, bukan payment gateway asli.</p>
					<button type="button" disabled={!b.bisaQr} onClick={() => b.kirim("non_tunai")} className={`${tombolLunas} h-[54px]`}>
						<ScanLine aria-hidden className="size-[18px]" strokeWidth={2} />
						Tandai Lunas
					</button>
				</aside>
			</div>
		</div>
	);
}
