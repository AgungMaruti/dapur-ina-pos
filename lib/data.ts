import { db, urlGambar } from "./supabase";
import type { Kategori, ProdukView, Struk, Trx } from "./types";

// Embed PostgREST kadang mengembalikan objek (relasi 1:1) kadang array → seragamkan.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const satu = (x: any): any => (Array.isArray(x) ? x[0] : (x ?? undefined));

export async function getKategori(): Promise<Kategori[]> {
	const { data, error } = await db().from("kategori").select("id,nama_kategori");
	if (error) throw new Error(`kategori: ${error.message}`);
	const urutan = ["Makanan Utama", "Appetizer", "Minuman"]; // urutan tetap sesuai PRD/desain
	return (data as Kategori[]).sort((a, b) => urutan.indexOf(a.nama_kategori) - urutan.indexOf(b.nama_kategori));
}

export async function getProduk(): Promise<ProdukView[]> {
	const { data, error } = await db()
		.from("produk")
		.select("id,nama_produk,harga,id_kategori,kategori(nama_kategori),stok(jumlah,diperbarui_pada)")
		.order("nama_produk");
	if (error) throw new Error(`produk: ${error.message}`);
	return data.map((p) => {
		const s = satu(p.stok);
		return {
			id: p.id,
			nama_produk: p.nama_produk,
			harga: Number(p.harga),
			id_kategori: p.id_kategori,
			kategori: satu(p.kategori)?.nama_kategori ?? "",
			jumlah: s?.jumlah ?? 0,
			gambar_url: urlGambar(p.id, s?.diperbarui_pada ?? ""),
		};
	});
}

/** Transaksi LUNAS sejak `sejak` (ISO), terbaru dulu. Dipaginasi karena PostgREST membatasi 1000 baris. */
export async function getTransaksiLunas(sejak: string): Promise<Trx[]> {
	const hasil: Trx[] = [];
	for (let dari = 0; ; dari += 1000) {
		const { data, error } = await db()
			.from("transaksi")
			.select("id,tanggal,total_tagihan,pesanan!inner(nama_pelanggan,status)")
			.eq("pesanan.status", "lunas")
			.gte("tanggal", sejak)
			.order("tanggal", { ascending: false })
			.range(dari, dari + 999);
		if (error) throw new Error(`transaksi: ${error.message}`);
		for (const t of data) {
			hasil.push({ id: t.id, tanggal: t.tanggal, total: Number(t.total_tagihan), nama: satu(t.pesanan)?.nama_pelanggan ?? null });
		}
		if (data.length < 1000) return hasil;
	}
}

/** `id` = uuid transaksi, atau "terakhir" untuk transaksi lunas terbaru. */
export async function getStruk(id: string): Promise<Struk | null> {
	const kolom =
		"id,tanggal,total_tagihan,profil(nama),pesanan!inner(nama_pelanggan,status,detail_pesanan(jumlah,subtotal,produk(nama_produk))),pembayaran(metode,jumlah_bayar,kembalian,nomor_referensi,status)";
	const q = db().from("transaksi").select(kolom).eq("pesanan.status", "lunas");
	const { data, error } =
		id === "terakhir"
			? await q.order("tanggal", { ascending: false }).limit(1).maybeSingle()
			: /^[0-9a-f-]{36}$/i.test(id)
				? await q.eq("id", id).maybeSingle()
				: { data: null, error: null };
	if (error) throw new Error(`struk: ${error.message}`);
	if (!data) return null;
	const pesanan = satu(data.pesanan);
	const bayar = satu(data.pembayaran)?.status === "lunas" ? satu(data.pembayaran) : undefined;
	if (!pesanan || !bayar) return null;
	return {
		id: data.id,
		kode: `TRX-${data.id.slice(0, 8).toUpperCase()}`,
		tanggal: data.tanggal,
		nama_pelanggan: pesanan.nama_pelanggan,
		kasir: satu(data.profil)?.nama ?? "-",
		items: pesanan.detail_pesanan.map((d: { jumlah: number; subtotal: number; produk: unknown }) => ({
			nama: satu(d.produk)?.nama_produk ?? "(produk dihapus)",
			jumlah: d.jumlah,
			harga: Number(d.subtotal) / d.jumlah,
			subtotal: Number(d.subtotal),
		})),
		total: Number(data.total_tagihan),
		metode: bayar.metode,
		jumlah_bayar: Number(bayar.jumlah_bayar),
		kembalian: bayar.kembalian == null ? null : Number(bayar.kembalian),
		nomor_referensi: bayar.nomor_referensi,
	};
}

export async function getJumlahAkun(): Promise<{ kasir: number; administrator: number }> {
	const { data, error } = await db().from("profil").select("peran");
	if (error) throw new Error(`profil: ${error.message}`);
	return {
		kasir: data.filter((p) => p.peran === "kasir").length,
		administrator: data.filter((p) => p.peran === "administrator").length,
	};
}
