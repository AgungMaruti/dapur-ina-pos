"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeDollarSign, ReceiptText, Search, ShoppingBag, UserRound } from "lucide-react";
import { PageHeader, Kosong } from "@/components/page-header";
import { gabung, setNama, tambah, useCart } from "@/lib/cart-store";
import { formatRupiah } from "@/lib/format";
import type { ProdukView } from "@/lib/types";

type Slug = "makanan" | "appetizer" | "minuman";
const KATEGORI: { slug: Slug; nama: string; label: string }[] = [
	{ slug: "makanan", nama: "Makanan Utama", label: "Makanan" },
	{ slug: "appetizer", nama: "Appetizer", label: "Appetizer" },
	{ slug: "minuman", nama: "Minuman", label: "Minuman" },
];

function Kartu({ p, dikeranjang }: { p: ProdukView; dikeranjang: number }) {
	const habis = p.jumlah <= 0;
	const penuh = !habis && dikeranjang >= p.jumlah;
	return (
		<div className="flex min-w-0 flex-col gap-2 rounded-[24px] border border-border bg-surface p-2.5 lg:gap-2.5 lg:p-3">
			<div
				aria-hidden
				className="h-[76px] w-full shrink-0 rounded-[18px] border border-[#0000001A] bg-border bg-cover bg-center lg:h-[140px]"
				style={{ backgroundImage: `url(${p.gambar_url})` }}
			/>
			<p className="shrink-0 truncate text-[13px]/[15px] font-extrabold text-primary lg:text-[16px]/[19px] lg:font-black">{p.nama_produk}</p>
			<p className="shrink-0 whitespace-nowrap text-[14px]/[17px] font-black text-primary">{formatRupiah(p.harga)}</p>
			<button
				type="button"
				disabled={habis || penuh}
				onClick={() => tambah(p)}
				aria-label={habis ? `${p.nama_produk} habis` : `Tambah ${p.nama_produk}`}
				className={`mt-1 flex h-[30px] w-full shrink-0 items-center justify-center rounded-[99px] text-[11px]/[13px] font-extrabold transition-opacity lg:h-9 lg:text-[12px]/[14px] lg:font-black ${
					habis
						? "cursor-not-allowed bg-border text-muted"
						: "bg-[#1717170F] text-primary hover:opacity-80 disabled:opacity-50 lg:bg-primary lg:text-white"
				}`}
			>
				{habis ? "Habis" : penuh ? "Stok maks" : <><span className="lg:hidden">+ Tambah</span><span className="hidden lg:inline">Tambah</span></>}
			</button>
		</div>
	);
}

export function MenuView({ produk, slug }: { produk: ProdukView[]; slug: Slug }) {
	const cart = useCart();
	const [q, setQ] = useState("");
	const aktif = KATEGORI.find((k) => k.slug === slug)!;
	const { lines, total } = gabung(cart.items, produk);
	const jumlahItem = lines.length;
	const needle = q.trim().toLowerCase();
	const tampil = produk.filter((p) => p.kategori === aktif.nama && (!needle || p.nama_produk.toLowerCase().includes(needle)));
	const nama = cart.nama.trim();

	return (
		<div className="flex flex-col gap-4 p-5 lg:gap-[18px] lg:p-0 lg:pt-[18px]">
			<PageHeader
				judul={slug === "makanan" ? "Kasir POS" : `Kasir ${aktif.label}`}
				subjudul={`Menu ${aktif.label.toLowerCase()}`}
				judulDesktop="Kasir POS"
				subjudulDesktop="Pilih menu, kelola keranjang, lalu bayar."
				aksi={
					<label className="flex h-[50px] w-[360px] shrink-0 items-center gap-2.5 rounded-[18px] border border-border bg-surface px-3.5">
						<Search aria-hidden className="size-[18px] shrink-0 text-muted" strokeWidth={2} />
						<span className="sr-only">Cari menu</span>
						<input
							type="search"
							value={q}
							onChange={(e) => setQ(e.target.value)}
							placeholder="Cari menu"
							className="min-w-0 flex-1 bg-transparent text-[14px]/[17px] font-semibold text-primary outline-none placeholder:text-muted"
						/>
					</label>
				}
			/>

			<div className="flex h-[38px] w-full shrink-0 items-center justify-between rounded-[18px] bg-primary px-2.5 lg:hidden">
				<span className="flex items-center gap-[7px] text-[12px] font-black text-white">
					<BadgeDollarSign aria-hidden className="size-4" strokeWidth={2} />
					Mode Kasir
				</span>
				<span className="rounded-[99px] bg-white/10 px-2.5 py-1.5 text-[11px] font-extrabold text-bg">Aktif</span>
			</div>

			<div className="flex w-full flex-col gap-4 lg:h-[58px] lg:flex-row lg:items-center lg:gap-[14px]">
				<label className="flex h-[50px] w-full shrink-0 items-center gap-2.5 rounded-[18px] border border-border bg-surface px-3.5 lg:h-full lg:w-[420px] lg:rounded-[20px] lg:px-4">
					<UserRound aria-hidden className="size-5 shrink-0 text-muted lg:size-[18px]" strokeWidth={2} />
					<span className="sr-only">Nama pelanggan</span>
					<input
						type="text"
						maxLength={100}
						value={cart.nama}
						onChange={(e) => setNama(e.target.value)}
						placeholder="Nama pelanggan (opsional)"
						className="min-w-0 flex-1 bg-transparent text-[13px]/[15px] font-extrabold text-primary outline-none placeholder:font-semibold placeholder:text-muted lg:text-[14px]/[17px]"
					/>
				</label>
				<div role="tablist" aria-label="Kategori menu" className="flex w-full shrink-0 items-start gap-2 lg:h-full lg:flex-1 lg:items-center">
					{KATEGORI.map((k) => (
						<Link
							key={k.slug}
							role="tab"
							aria-selected={k.slug === slug}
							href={`/kasir/menu?category=${k.slug}`}
							className={`flex h-fit items-center justify-center whitespace-nowrap rounded-[99px] border px-3 py-2 text-[12px] font-bold transition-colors lg:h-full lg:rounded-[18px] lg:px-[18px] lg:py-0 lg:text-[13px]/[15px] lg:font-black ${
								k.slug === slug ? "border-primary bg-primary text-white" : "border-border bg-surface text-muted hover:border-primary/40 hover:text-primary"
							}`}
						>
							{k.label}
						</Link>
					))}
				</div>
			</div>

			<div className="flex w-full flex-col gap-4 lg:flex-row lg:items-start lg:gap-5">
				<div className="min-w-0 flex-1">
					{tampil.length === 0 ? (
						<Kosong>{produk.length === 0 ? "Belum ada menu. Admin bisa menambah produk." : "Tidak ada menu yang cocok."}</Kosong>
					) : (
						<div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:gap-[14px]">
							{tampil.map((p) => (
								<Kartu key={p.id} p={p} dikeranjang={cart.items.find((i) => i.idProduk === p.id)?.jumlah ?? 0} />
							))}
						</div>
					)}
				</div>

				{/* Keranjang desktop */}
				<aside className="hidden w-[360px] shrink-0 flex-col gap-3 rounded-[28px] border border-border bg-surface p-[18px] lg:flex lg:min-h-[420px]">
					<h2 className="text-[22px]/[26px] font-black text-primary">Keranjang</h2>
					{lines.length === 0 ? (
						<p className="text-[13px]/[15px] font-semibold text-muted">Belum ada item di keranjang.</p>
					) : (
						lines.map((l) => (
							<div key={l.produk.id} className="flex h-11 w-full items-center justify-between gap-2">
								<span className="truncate text-[13px]/[15px] font-extrabold text-primary">
									{l.produk.nama_produk} x{l.jumlah}
								</span>
								<span className="shrink-0 whitespace-nowrap text-[13px]/[15px] font-black text-primary">{formatRupiah(l.subtotal)}</span>
							</div>
						))
					)}
					<div className="flex h-[62px] w-full items-center justify-between rounded-[20px] bg-primary px-3.5">
						<span className="text-[14px]/[17px] font-extrabold text-white">Total</span>
						<span className="whitespace-nowrap text-[22px]/[26px] font-black text-white">{formatRupiah(total)}</span>
					</div>
					<div className="flex w-full flex-col gap-2.5 rounded-[22px] border border-border bg-bg p-3.5">
						<p className="text-[14px]/[17px] font-black text-primary">Draft pesanan</p>
						<p className="flex items-center gap-2 text-[12px]/[14px] font-extrabold text-muted">
							<UserRound aria-hidden className="size-[15px] shrink-0" strokeWidth={2} />
							{nama || "Tanpa nama"} • {jumlahItem} item
						</p>
						<Link href="/kasir/pesanan" className="flex h-11 w-full items-center justify-center gap-2 rounded-[99px] bg-primary text-[13px]/[15px] font-black text-white transition-opacity hover:opacity-90">
							<ShoppingBag aria-hidden className="size-[15px]" strokeWidth={2} />
							Lanjut ke Pesanan
						</Link>
					</div>
				</aside>
			</div>

			{/* Ringkasan draft mobile */}
			<div className="flex h-[94px] w-full items-center gap-2.5 rounded-[26px] border border-border bg-surface p-2.5 shadow-[0px_14px_28px_0px_#6B3D261F] lg:hidden">
				<div className="flex size-[62px] shrink-0 flex-col items-center justify-center gap-1 rounded-[18px] border border-border bg-bg">
					<ReceiptText aria-hidden className="size-[19px] text-primary" strokeWidth={2} />
					<span className="whitespace-nowrap text-[10px] font-black text-primary">{jumlahItem} item</span>
				</div>
				<div className="flex min-w-0 flex-1 flex-col gap-1">
					<span className="text-[10px] font-extrabold text-[#8A7A72]">Draft pesanan</span>
					<span className="truncate font-heading text-[16px] font-black text-primary">{nama || "Tanpa nama"}</span>
					<span className="truncate text-[11px] font-bold text-[#8A7A72]">{jumlahItem} item • draft</span>
				</div>
				<div className="flex w-[118px] shrink-0 flex-col items-end gap-[7px]">
					<span className="whitespace-nowrap text-[18px]/[21px] font-black text-primary">{formatRupiah(total)}</span>
					<Link href="/kasir/pesanan" className="flex h-[30px] w-full items-center justify-center gap-[5px] rounded-[99px] bg-primary text-[10px]/[12px] font-black text-white transition-opacity hover:opacity-90">
						<ShoppingBag aria-hidden className="size-[13px]" strokeWidth={2} />
						Pesanan
					</Link>
				</div>
			</div>
		</div>
	);
}
