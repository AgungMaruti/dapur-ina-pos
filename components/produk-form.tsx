"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Save, Trash2 } from "lucide-react";
import { hapusProduk, simpanProduk } from "@/lib/actions";
import type { Kategori, ProdukView } from "@/lib/types";

const baris = "flex h-[48px] w-full shrink-0 items-center justify-between gap-2 rounded-[16px] border border-border bg-bg px-3";
const isian = "min-w-0 flex-1 bg-transparent text-right text-[12px]/[14px] font-black text-primary outline-none placeholder:font-semibold placeholder:text-muted/70 lg:text-[13px]";

/** Perkecil foto ke maks 640px JPEG sebelum diunggah (hemat storage & bandwidth). */
async function kecilkan(file: File): Promise<File> {
	const bmp = await createImageBitmap(file);
	const skala = Math.min(1, 640 / Math.max(bmp.width, bmp.height));
	const c = document.createElement("canvas");
	c.width = Math.round(bmp.width * skala);
	c.height = Math.round(bmp.height * skala);
	c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
	const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.82));
	if (!blob) throw new Error("Gambar tidak bisa diproses.");
	return new File([blob], "gambar.jpg", { type: "image/jpeg" });
}

/**
 * Form tambah/ubah produk. `panel` = panel kanan desktop (tombol Simpan di header),
 * selain itu halaman penuh mobile (tombol Simpan di bawah). Ubah `key` untuk mereset.
 */
export function ProdukForm({ kategori, produk, panel = false, selesai }: { kategori: Kategori[]; produk?: ProdukView; panel?: boolean; selesai: string }) {
	const router = useRouter();
	const [nama, setNama] = useState(produk?.nama_produk ?? "");
	const [harga, setHarga] = useState(produk ? String(produk.harga) : "");
	const [stok, setStok] = useState(produk ? String(produk.jumlah) : "");
	const [idKategori, setIdKategori] = useState(produk?.id_kategori ?? kategori[0]?.id ?? "");
	const [berkas, setBerkas] = useState<File | null>(null);
	const [pratinjau, setPratinjau] = useState<string | null>(produk?.gambar_url ?? null);
	const [error, setError] = useState<string | null>(null);
	const [proses, mulai] = useTransition();
	const fileRef = useRef<HTMLInputElement>(null);
	const angka = (v: string) => v.replace(/\D/g, "");

	async function pilihGambar(e: React.ChangeEvent<HTMLInputElement>) {
		const f = e.target.files?.[0];
		if (!f) return;
		try {
			const kecil = await kecilkan(f);
			setBerkas(kecil);
			setPratinjau(URL.createObjectURL(kecil));
		} catch {
			setError("File bukan gambar yang valid.");
		}
	}

	function simpan(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		const fd = new FormData();
		fd.set("id", produk?.id ?? "");
		fd.set("nama", nama);
		fd.set("harga", harga || "0");
		fd.set("stok", stok || "0");
		fd.set("id_kategori", idKategori);
		if (berkas) fd.set("gambar", berkas);
		mulai(async () => {
			const r = await simpanProduk(fd);
			if (!r.ok) return setError(r.error);
			router.replace(selesai);
			router.refresh();
			if (!produk) {
				setNama("");
				setHarga("");
				setStok("");
				setBerkas(null);
				setPratinjau(null);
			}
		});
	}

	function hapus() {
		if (!produk || !confirm(`Hapus "${produk.nama_produk}"?`)) return;
		mulai(async () => {
			const r = await hapusProduk(produk.id);
			if (!r.ok) return setError(r.error);
			router.replace(selesai);
			router.refresh();
		});
	}

	const tombol = (
		<button
			type="submit"
			form="form-produk"
			disabled={proses}
			className={
				panel
					? "flex h-11 shrink-0 items-center gap-2 rounded-[99px] bg-primary px-5 text-[13px] font-black text-white transition-opacity hover:opacity-90 disabled:opacity-60"
					: "mt-1.5 flex h-[54px] w-full items-center justify-center gap-2 rounded-[99px] bg-primary text-[14px]/[17px] font-black text-white transition-opacity hover:opacity-90 disabled:opacity-60"
			}
		>
			<Save aria-hidden className="size-[17px]" strokeWidth={2} />
			{proses ? "Menyimpan…" : panel ? "Simpan" : "Simpan Produk"}
		</button>
	);

	return (
		<div className="flex w-full flex-col gap-3.5">
			{panel ? (
				<div className="flex items-center justify-between gap-3">
					<h2 className="text-[20px]/[24px] font-black text-primary">{produk ? "Ubah produk" : "Form tambah produk"}</h2>
					{tombol}
				</div>
			) : null}

			<button
				type="button"
				onClick={() => fileRef.current?.click()}
				className="flex h-[150px] w-full shrink-0 flex-col items-center justify-center gap-2 overflow-hidden rounded-[28px] border border-border bg-surface bg-cover bg-center transition-opacity hover:opacity-90 lg:h-[200px]"
				style={pratinjau ? { backgroundImage: `url(${pratinjau})` } : undefined}
				aria-label="Pilih gambar produk"
			>
				{pratinjau ? null : (
					<>
						<ImagePlus aria-hidden className="size-8 text-muted" strokeWidth={2} />
						<span className="text-[13px]/[15px] font-black text-muted">{panel ? "Tambah gambar" : "Tambah gambar menu"}</span>
					</>
				)}
			</button>
			<input ref={fileRef} type="file" accept="image/*" tabIndex={-1} onChange={pilihGambar} className="hidden" />

			<form id="form-produk" onSubmit={simpan} className={`flex w-full flex-col gap-2.5 ${panel ? "" : "rounded-[28px] border border-border bg-surface p-4"}`}>
				<label className={baris}>
					<span className="shrink-0 text-[11px]/[13px] font-extrabold text-muted">Nama produk</span>
					<input value={nama} maxLength={100} onChange={(e) => setNama(e.target.value)} placeholder="Nama menu" className={isian} />
				</label>
				<label className={baris}>
					<span className="shrink-0 text-[11px]/[13px] font-extrabold text-muted">Harga (Rp)</span>
					<input inputMode="numeric" value={harga} onChange={(e) => setHarga(angka(e.target.value))} placeholder="0" className={isian} />
				</label>
				<label className={baris}>
					<span className="shrink-0 text-[11px]/[13px] font-extrabold text-muted">Stok</span>
					<input inputMode="numeric" value={stok} onChange={(e) => setStok(angka(e.target.value))} placeholder="0" className={isian} />
				</label>
				<label className={baris}>
					<span className="shrink-0 text-[11px]/[13px] font-extrabold text-muted">Kategori</span>
					<select value={idKategori} onChange={(e) => setIdKategori(e.target.value)} className={`${isian} cursor-pointer appearance-none`}>
						{kategori.map((k) => (
							<option key={k.id} value={k.id}>
								{k.nama_kategori}
							</option>
						))}
					</select>
				</label>
				<div className={baris}>
					<span className="shrink-0 text-[11px]/[13px] font-extrabold text-muted">Status</span>
					<span className="text-[12px]/[14px] font-black text-primary lg:text-[13px]">{Number(stok) > 0 ? "Aktif (stok tersedia)" : "Habis (stok 0)"}</span>
				</div>

				{error ? (
					<p role="alert" className="text-[12px] font-bold text-danger">
						{error}
					</p>
				) : null}
				{panel ? null : tombol}
				{produk ? (
					<button type="button" onClick={hapus} disabled={proses} className="flex h-10 items-center justify-center gap-2 text-[12px] font-bold text-danger hover:underline disabled:opacity-50">
						<Trash2 aria-hidden className="size-4" strokeWidth={2} />
						Hapus produk
					</button>
				) : null}
			</form>
		</div>
	);
}
