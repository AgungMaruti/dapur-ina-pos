/** Tipe mengikuti skema Supabase LIVE (bukan PRD). Peran DB: pelanggan | kasir | administrator. */

export type Peran = "kasir" | "administrator";

export const PERAN_LABEL: Record<Peran, string> = { kasir: "Kasir", administrator: "Admin" };

export type MetodeBayar = "tunai" | "non_tunai";

/** produk + stok + kategori, siap tampil. `menipis` hanya turunan UI (lihat statusStok). */
export interface ProdukView {
	id: string;
	nama_produk: string;
	harga: number;
	id_kategori: string;
	kategori: string;
	jumlah: number;
	gambar_url: string;
}

export interface Kategori {
	id: string;
	nama_kategori: string;
}

/** Baris keranjang (client-side saja). Nama/harga selalu diambil dari DB, bukan disimpan di sini. */
export interface CartLine {
	idProduk: string;
	jumlah: number;
}

export interface Trx {
	id: string;
	tanggal: string;
	total: number;
	nama: string | null;
}

export interface Struk {
	id: string;
	kode: string;
	tanggal: string;
	nama_pelanggan: string | null;
	kasir: string;
	items: { nama: string; jumlah: number; harga: number; subtotal: number }[];
	total: number;
	metode: MetodeBayar;
	jumlah_bayar: number;
	kembalian: number | null;
	nomor_referensi: string | null;
}

export type Hasil<T = object> = ({ ok: true } & T) | { ok: false; error: string };
