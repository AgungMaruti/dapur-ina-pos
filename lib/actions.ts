"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { beranda, getSesi, wajibPeran } from "./auth";
import { hitungKembalian, hitungTotal } from "./format";
import { db, supabaseAuth } from "./supabase";
import { PERAN_LABEL, type Hasil, type MetodeBayar, type Peran } from "./types";

const segarkan = () => {
	revalidatePath("/kasir", "layout");
	revalidatePath("/admin", "layout");
};

/* ------------------------------------------------------------------ */
/* auth                                                                */
/* ------------------------------------------------------------------ */

export async function login(_: string | null, form: FormData): Promise<string | null> {
	const email = String(form.get("email") ?? "").trim();
	const password = String(form.get("password") ?? "");
	const peran = form.get("peran") === "administrator" ? "administrator" : "kasir";
	if (!email || !password) return "Isi email dan kata sandi.";

	const supabase = await supabaseAuth();
	const { data, error } = await supabase.auth.signInWithPassword({ email, password });
	if (error || !data.user) return "Email atau kata sandi salah.";

	const { data: p } = await db().from("profil").select("peran").eq("id", data.user.id).maybeSingle();
	if (p?.peran !== peran) {
		await supabase.auth.signOut();
		return p?.peran === "kasir" || p?.peran === "administrator"
			? `Akun ini bukan ${PERAN_LABEL[peran]}. Pilih role ${PERAN_LABEL[p.peran as Peran]}.`
			: "Akun ini tidak punya akses ke POS.";
	}
	redirect(beranda(peran));
}

export async function logout() {
	await (await supabaseAuth()).auth.signOut();
	redirect("/login");
}

/* ------------------------------------------------------------------ */
/* stok (compare-and-swap: aman dari race tanpa RPC/transaksi DB)      */
/* ------------------------------------------------------------------ */

/** Geser stok `delta`. Update hanya berlaku jika jumlah belum berubah sejak dibaca; ulang bila bentrok. */
async function geserStok(idProduk: string, delta: number): Promise<Hasil<{ jumlah: number }>> {
	for (let i = 0; i < 10; i++) {
		if (i) await new Promise((r) => setTimeout(r, Math.random() * 60 * i)); // jeda acak: bubarkan tabrakan
		const { data: s } = await db().from("stok").select("id,jumlah").eq("id_produk", idProduk).maybeSingle();
		if (!s) return { ok: false, error: "Stok produk tidak ditemukan." };
		const baru = s.jumlah + delta;
		if (baru < 0) return { ok: false, error: "Stok tidak mencukupi." };
		const { data: upd, error } = await db()
			.from("stok")
			.update({ jumlah: baru, status: baru > 0 ? "tersedia" : "habis", diperbarui_pada: new Date().toISOString() })
			.eq("id", s.id)
			.eq("jumlah", s.jumlah)
			.select("id");
		if (error) return { ok: false, error: error.message };
		if (upd.length) return { ok: true, jumlah: baru };
	}
	return { ok: false, error: "Stok sedang berubah, coba lagi." };
}

export async function ubahStok(idProduk: string, delta: number): Promise<void> {
	await wajibPeran("administrator");
	await geserStok(idProduk, delta);
	segarkan();
}

/* ------------------------------------------------------------------ */
/* pemesanan → transaksi → pembayaran (Fase 3–5)                       */
/* ------------------------------------------------------------------ */

interface BayarInput {
	items: { idProduk: string; jumlah: number }[];
	nama: string;
	metode: MetodeBayar;
	uangDiterima?: number;
	referensi?: string;
}

export async function bayar(input: BayarInput): Promise<Hasil<{ id: string }>> {
	const sesi = await getSesi();
	if (sesi?.peran !== "kasir") return { ok: false, error: "Sesi kasir tidak valid. Silakan login ulang." };

	// gabungkan baris duplikat, buang jumlah tidak valid
	const qty = new Map<string, number>();
	for (const i of input.items) {
		if (!Number.isInteger(i.jumlah) || i.jumlah <= 0) return { ok: false, error: "Jumlah item tidak valid." };
		qty.set(i.idProduk, (qty.get(i.idProduk) ?? 0) + i.jumlah);
	}
	if (!qty.size) return { ok: false, error: "Keranjang kosong. Tambah menu dulu." };

	// harga & stok dibaca dari DB — total TIDAK pernah dipercaya dari client (PRD 5.2)
	const { data: prod, error: eProd } = await db()
		.from("produk")
		.select("id,nama_produk,harga,stok(jumlah)")
		.in("id", [...qty.keys()]);
	if (eProd) return { ok: false, error: eProd.message };
	const detail: { id_produk: string; jumlah: number; subtotal: number }[] = [];
	for (const [id, jumlah] of qty) {
		const p = prod.find((x) => x.id === id);
		if (!p) return { ok: false, error: "Ada menu yang sudah dihapus. Perbarui keranjang." };
		const s = Array.isArray(p.stok) ? p.stok[0] : p.stok;
		if (!s || s.jumlah < jumlah) return { ok: false, error: `Stok ${p.nama_produk} tidak mencukupi.` };
		detail.push({ id_produk: id, jumlah, subtotal: Number(p.harga) * jumlah });
	}
	const total = hitungTotal(detail);

	let kembalian: number | null = null;
	let jumlahBayar = total;
	let referensi: string | null = null;
	if (input.metode === "tunai") {
		jumlahBayar = Number(input.uangDiterima);
		if (!Number.isFinite(jumlahBayar)) return { ok: false, error: "Isi uang diterima." };
		kembalian = hitungKembalian(jumlahBayar, total);
		if (kembalian === null) return { ok: false, error: "Uang diterima kurang dari total tagihan." };
	} else {
		referensi = input.referensi?.trim().slice(0, 50) || `QR-${Date.now().toString(36).toUpperCase()}`;
	}

	const { data: pesanan, error: ePes } = await db()
		.from("pesanan")
		.insert({ id_pengguna: sesi.id, nama_pelanggan: input.nama.trim().slice(0, 100) || null, status: "menunggu", tanggal: new Date().toISOString() })
		.select("id")
		.single();
	if (ePes) return { ok: false, error: ePes.message };

	const dikurangi: [string, number][] = [];
	const batal = async (error: string): Promise<Hasil<{ id: string }>> => {
		for (const [id, n] of dikurangi) await geserStok(id, n); // kembalikan stok yang sudah terlanjur dikurangi
		await db().from("pesanan").update({ status: "batal" }).eq("id", pesanan.id);
		return { ok: false, error };
	};

	try {
		for (const d of detail) {
			const r = await geserStok(d.id_produk, -d.jumlah);
			if (!r.ok) return await batal(r.error);
			dikurangi.push([d.id_produk, d.jumlah]);
		}
		await db().from("pesanan").update({ status: "diproses" }).eq("id", pesanan.id);

		const { error: eDet } = await db()
			.from("detail_pesanan")
			.insert(detail.map((d) => ({ ...d, id_pesanan: pesanan.id })));
		if (eDet) return await batal(eDet.message);

		const { data: trx, error: eTrx } = await db()
			.from("transaksi")
			.insert({ id_pesanan: pesanan.id, id_kasir: sesi.id, total_tagihan: total, tanggal: new Date().toISOString() })
			.select("id")
			.single();
		if (eTrx) return await batal(eTrx.message);

		const { error: eBayar } = await db().from("pembayaran").insert({
			id_transaksi: trx.id,
			metode: input.metode,
			jumlah_bayar: jumlahBayar,
			kembalian,
			nomor_referensi: referensi,
			status: "lunas",
			dibuat_pada: new Date().toISOString(),
		});
		if (eBayar) return await batal(eBayar.message);

		await db().from("pesanan").update({ status: "lunas" }).eq("id", pesanan.id);
		segarkan();
		return { ok: true, id: trx.id };
	} catch (e) {
		return await batal(e instanceof Error ? e.message : "Pembayaran gagal.");
	}
}

/* ------------------------------------------------------------------ */
/* produk (Fase 2)                                                     */
/* ------------------------------------------------------------------ */

export async function simpanProduk(form: FormData): Promise<Hasil<{ id: string }>> {
	await wajibPeran("administrator");
	const id = String(form.get("id") ?? "");
	const nama = String(form.get("nama") ?? "").trim();
	const harga = Number(form.get("harga"));
	const stok = Number(form.get("stok"));
	const idKategori = String(form.get("id_kategori") ?? "");
	const gambar = form.get("gambar");

	if (!nama) return { ok: false, error: "Nama produk wajib diisi." };
	if (nama.length > 100) return { ok: false, error: "Nama produk maksimal 100 karakter." };
	if (!Number.isInteger(harga) || harga < 0) return { ok: false, error: "Harga harus angka ≥ 0." };
	if (!Number.isInteger(stok) || stok < 0) return { ok: false, error: "Stok tidak boleh negatif." };
	if (!idKategori) return { ok: false, error: "Pilih kategori." };

	let idProduk = id;
	if (id) {
		const { error } = await db().from("produk").update({ nama_produk: nama, harga, id_kategori: idKategori }).eq("id", id);
		if (error) return { ok: false, error: error.message };
	} else {
		const { data, error } = await db()
			.from("produk")
			.insert({ nama_produk: nama, harga, id_kategori: idKategori })
			.select("id")
			.single();
		if (error) return { ok: false, error: error.message };
		idProduk = data.id;
	}

	// set jumlah stok (PRD Modul C); status tersedia/habis otomatis
	const stokRow = { jumlah: stok, status: stok > 0 ? "tersedia" : "habis", diperbarui_pada: new Date().toISOString() };
	const { data: ada } = await db().from("stok").select("id").eq("id_produk", idProduk).maybeSingle();
	const { error: eStok } = ada
		? await db().from("stok").update(stokRow).eq("id", ada.id)
		: await db().from("stok").insert({ id_produk: idProduk, ...stokRow });
	if (eStok) return { ok: false, error: eStok.message };

	if (gambar instanceof File && gambar.size > 0) {
		if (!gambar.type.startsWith("image/") || gambar.size > 1_000_000) return { ok: false, error: "Gambar harus berupa foto ≤ 1 MB." };
		const { error } = await db().storage.from("produk").upload(`${idProduk}.jpg`, await gambar.arrayBuffer(), {
			contentType: gambar.type,
			upsert: true,
		});
		if (error) return { ok: false, error: `Gambar gagal diunggah: ${error.message}` };
	}
	segarkan();
	return { ok: true, id: idProduk };
}

export async function hapusProduk(id: string): Promise<Hasil> {
	await wajibPeran("administrator");
	const { count } = await db().from("detail_pesanan").select("id", { count: "exact", head: true }).eq("id_produk", id);
	if (count) return { ok: false, error: "Produk sudah pernah terjual, tidak bisa dihapus. Set stok 0 agar tampil Habis." };
	await db().from("stok").delete().eq("id_produk", id);
	const { error } = await db().from("produk").delete().eq("id", id);
	if (error) return { ok: false, error: error.message };
	await db().storage.from("produk").remove([`${id}.jpg`]);
	segarkan();
	return { ok: true };
}
