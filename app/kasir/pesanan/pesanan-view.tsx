"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Minus, Pencil, Plus, QrCode, ShoppingBag, UserRound } from "lucide-react";
import { Kosong, PageHeader, tombolGelap } from "@/components/page-header";
import { gabung, setJumlah, setNama, useCart } from "@/lib/cart-store";
import { formatRupiah } from "@/lib/format";
import type { ProdukView } from "@/lib/types";

const btnQty = "flex size-7 items-center justify-center rounded-[10px]";

function Stepper({ p, jumlah }: { p: ProdukView; jumlah: number }) {
	return (
		<>
			<button type="button" aria-label={`Kurangi ${p.nama_produk}`} onClick={() => setJumlah(p.id, jumlah - 1, p.jumlah)} className={`${btnQty} border border-border bg-bg text-primary`}>
				<Minus aria-hidden className="size-3.5" strokeWidth={2} />
			</button>
			<span className="min-w-4 text-center text-[13px]/[15px] font-black text-primary">{jumlah}</span>
			<button
				type="button"
				aria-label={`Tambah ${p.nama_produk}`}
				disabled={jumlah >= p.jumlah}
				onClick={() => setJumlah(p.id, jumlah + 1, p.jumlah)}
				className={`${btnQty} bg-primary text-white disabled:opacity-40`}
			>
				<Plus aria-hidden className="size-3.5" strokeWidth={2} />
			</button>
		</>
	);
}

export function PesananView({ produk }: { produk: ProdukView[] }) {
	const cart = useCart();
	const { lines, total } = gabung(cart.items, produk);
	const [ubah, setUbah] = useState(false);
	const nama = cart.nama.trim() || "Tanpa nama";
	const kosong = lines.length === 0;

	const kosongView = (
		<Kosong>
			<p>Belum ada item. Tambah menu dulu.</p>
			<Link href="/kasir/menu?category=makanan" className={tombolGelap}>
				Buka Menu
			</Link>
		</Kosong>
	);

	return (
		<div className="flex flex-col gap-4 p-5 lg:gap-[18px] lg:p-0 lg:pt-[18px]">
			<PageHeader
				judul="Pesanan Aktif"
				subjudul={kosong ? "Draft kosong" : `${lines.length} item`}
				subjudulDesktop="Review draft pesanan sebelum masuk pembayaran."
				aksi={
					<Link href="/kasir/menu?category=makanan" className="flex h-[50px] items-center gap-2 rounded-[99px] border border-border bg-surface px-5 text-[14px]/[17px] font-black text-primary transition-opacity hover:opacity-90">
						+ Tambah menu
					</Link>
				}
			/>

			{/* Mobile */}
			<div className="flex flex-col gap-4 lg:hidden">
				{kosong ? (
					kosongView
				) : (
					<>
						<section aria-label="Item pesanan" className="flex w-full flex-col gap-2.5 rounded-[28px] border border-border bg-surface p-3.5">
							<div className="flex items-center justify-between">
								<h2 className="text-[14px]/[17px] font-black text-primary">Detail pesanan</h2>
								<span className="rounded-[99px] bg-primary/10 px-2.5 py-1 text-[10px] font-black text-primary">Draft</span>
							</div>
							<p className="text-[13px]/[15px] font-black text-primary">{nama}</p>
							<ul className="flex flex-col">
								{lines.map((l) => (
									<li key={l.produk.id} className="flex h-[54px] items-center justify-between gap-2 border-b border-border last:border-b-0">
										<div className="flex min-w-0 flex-col gap-0.5">
											<span className="truncate text-[13px]/[15px] font-black text-primary">{l.produk.nama_produk}</span>
											<span className="text-[11px] font-bold text-muted">{formatRupiah(l.produk.harga)}</span>
										</div>
										<div className="flex shrink-0 items-center gap-1.5">
											<Stepper p={l.produk} jumlah={l.jumlah} />
										</div>
									</li>
								))}
							</ul>
						</section>
						<section aria-label="Ringkasan tagihan" className="flex h-[94px] w-full items-center gap-2.5 rounded-[26px] border border-border bg-surface p-2.5 shadow-[0px_14px_28px_0px_#6B3D261F]">
							<div className="flex min-w-0 flex-1 flex-col gap-1 pl-1.5">
								<span className="text-[10px] font-extrabold text-[#8A7A72]">Tagihan aktif</span>
								<span className="truncate font-heading text-[16px] font-black text-primary">{nama}</span>
								<span className="truncate text-[11px] font-bold text-[#8A7A72]">{lines.length} item • siap dibayar</span>
							</div>
							<div className="flex shrink-0 flex-col items-end gap-[7px]">
								<span className="whitespace-nowrap text-[18px]/[21px] font-black text-primary">{formatRupiah(total)}</span>
								<div className="flex w-[118px] gap-1.5">
									<Link href="/kasir/pembayaran?method=tunai" className="flex h-[30px] flex-1 items-center justify-center rounded-[99px] bg-primary text-[10px]/[12px] font-black text-white">
										Tunai
									</Link>
									<Link href="/kasir/pembayaran?method=qr" className="flex h-[30px] flex-1 items-center justify-center gap-1 rounded-[99px] border border-border bg-bg text-[10px]/[12px] font-black text-primary">
										<QrCode aria-hidden className="size-3" strokeWidth={2} />
										QR
									</Link>
								</div>
							</div>
						</section>
					</>
				)}
			</div>

			{/* Desktop */}
			<div className="hidden w-full gap-[18px] lg:flex">
				<div className="flex min-w-0 flex-1 flex-col gap-[14px]">
					<div className="flex h-[92px] w-full items-center gap-4 rounded-[28px] bg-primary p-5">
						<div className="flex size-[54px] shrink-0 items-center justify-center rounded-[18px] bg-white/10">
							<ShoppingBag aria-hidden className="size-6 text-white" strokeWidth={2} />
						</div>
						<div className="flex min-w-0 flex-1 flex-col gap-1">
							<p className="text-[18px]/[22px] font-black text-white">Pesanan aktif sedang disusun</p>
							<p className="truncate text-[13px]/[15px] font-semibold text-white/70">Review item, ubah qty, lalu lanjut ke pembayaran.</p>
						</div>
						<span className="shrink-0 rounded-[99px] bg-white px-3 py-2 text-[12px]/[14px] font-black text-primary">Draft</span>
					</div>

					<div className="flex min-h-[420px] flex-col overflow-hidden rounded-[28px] border border-border bg-surface">
						<div className="flex h-[52px] shrink-0 items-center bg-border/50 px-[18px] text-[12px]/[14px] font-black text-muted">
							<span className="flex-1">Menu</span>
							<span className="w-[130px] shrink-0">Qty</span>
							<span className="w-[130px] shrink-0">Harga</span>
							<span className="w-[130px] shrink-0">Subtotal</span>
						</div>
						{kosong ? (
							<p className="p-8 text-center text-[14px] font-semibold text-muted">Belum ada item di draft pesanan.</p>
						) : (
							lines.map((l) => (
								<div key={l.produk.id} className="flex h-[78px] w-full shrink-0 items-center px-[18px]">
									<div className="flex min-w-0 flex-1 flex-col gap-1">
										<p className="truncate text-[15px]/[18px] font-black text-primary">{l.produk.nama_produk}</p>
										<p className="text-[11px]/[13px] font-bold text-muted">{l.produk.kategori}</p>
									</div>
									<div className="flex w-[130px] shrink-0 items-center gap-2">
										<Stepper p={l.produk} jumlah={l.jumlah} />
									</div>
									<p className="w-[130px] shrink-0 text-[13px]/[15px] font-extrabold text-muted">{formatRupiah(l.produk.harga)}</p>
									<p className="w-[130px] shrink-0 text-[14px]/[17px] font-black text-primary">{formatRupiah(l.subtotal)}</p>
								</div>
							))
						)}
					</div>
				</div>

				<aside className="flex w-[360px] shrink-0 flex-col gap-3.5">
					<div className="flex w-full flex-col gap-3 rounded-[28px] border border-border bg-surface p-[18px]">
						<div className="flex items-center gap-2.5">
							<div className="flex size-[42px] shrink-0 items-center justify-center rounded-[15px] bg-primary">
								<UserRound aria-hidden className="size-5 text-white" strokeWidth={2} />
							</div>
							<div className="flex min-w-0 flex-1 flex-col gap-[3px]">
								{ubah ? (
									<input
										autoFocus
										maxLength={100}
										value={cart.nama}
										onChange={(e) => setNama(e.target.value)}
										onKeyDown={(e) => e.key === "Enter" && setUbah(false)}
										placeholder="Nama pelanggan"
										className="w-full rounded-[10px] border border-border bg-bg px-2 py-1 text-[16px] font-black text-primary outline-none"
									/>
								) : (
									<p className="truncate text-[18px]/[21px] font-black text-primary">{nama}</p>
								)}
								<p className="text-[12px]/[14px] font-bold text-muted">Walk-in customer</p>
							</div>
						</div>
						<button
							type="button"
							onClick={() => setUbah((v) => !v)}
							className="flex h-11 w-full items-center justify-center gap-2 rounded-[99px] border border-border bg-bg text-[12px]/[14px] font-black text-primary transition-opacity hover:opacity-80"
						>
							{ubah ? <Check aria-hidden className="size-4" strokeWidth={2} /> : <Pencil aria-hidden className="size-4" strokeWidth={2} />}
							{ubah ? "Selesai" : "Ubah nama pelanggan"}
						</button>
					</div>

					<div className="flex w-full flex-col gap-2.5 rounded-[28px] border border-border bg-surface p-[18px]">
						{[
							["Subtotal", total],
							["Pajak / Service", 0],
							["Diskon", 0],
						].map(([label, nilai]) => (
							<div key={label} className="flex items-start justify-between">
								<span className="text-[12px]/[14px] font-extrabold text-muted">{label}</span>
								<span className="text-[12px]/[14px] font-black text-primary">{formatRupiah(Number(nilai))}</span>
							</div>
						))}
						<div className="flex h-16 w-full items-center justify-between rounded-[20px] bg-primary p-3.5">
							<span className="text-[13px]/[15px] font-extrabold text-white">Total</span>
							<span className="whitespace-nowrap text-[24px]/[28px] font-black text-white">{formatRupiah(total)}</span>
						</div>
					</div>

					{kosong ? (
						<span className="flex h-[54px] w-full items-center justify-center gap-2 rounded-[99px] bg-primary text-[14px]/[17px] font-black text-white opacity-50">
							Lanjut ke Pembayaran
							<ArrowRight aria-hidden className="size-[18px]" strokeWidth={2} />
						</span>
					) : (
						<Link href="/kasir/pembayaran?method=tunai" className="flex h-[54px] w-full items-center justify-center gap-2 rounded-[99px] bg-primary text-[14px]/[17px] font-black text-white transition-opacity hover:opacity-90">
							Lanjut ke Pembayaran
							<ArrowRight aria-hidden className="size-[18px]" strokeWidth={2} />
						</Link>
					)}
					<p className="text-center text-[11px] font-bold text-muted">Draft tersimpan otomatis di perangkat ini • {lines.length} item</p>
				</aside>
			</div>
		</div>
	);
}
