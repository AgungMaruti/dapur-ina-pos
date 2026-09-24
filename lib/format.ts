/** Format & fungsi bisnis kritis (target unit test PRD §6). Murni, tanpa efek samping. */

export const WIB_MS = 7 * 3600 * 1000;

/** Geser ke WIB; baca komponen dengan getUTC*. */
export const wib = (d: Date | string): Date => new Date(new Date(d).getTime() + WIB_MS);

export function formatRupiah(value: number): string {
	return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
}

/** Ringkas: "Rp 486K", "Rp 54,5K" (1 desimal agar tidak menyesatkan). Hanya untuk kartu ringkasan. */
export function formatRupiahK(value: number): string {
	if (value < 1000) return formatRupiah(value);
	const k = Math.round(value / 100) / 10;
	return `Rp ${k.toLocaleString("id-ID")}K`;
}

export function formatWaktu(iso: string): string {
	return new Intl.DateTimeFormat("id-ID", {
		dateStyle: "medium",
		timeStyle: "short",
		timeZone: "Asia/Jakarta",
	}).format(new Date(iso));
}

/** Ambil digit saja; kosong → 0. */
export function parseAngka(raw: string): number {
	const digits = raw.replace(/\D/g, "");
	return digits ? Number.parseInt(digits, 10) : 0;
}

export function formatAngka(value: number): string {
	return value ? value.toLocaleString("id-ID") : "";
}

/** Total = jumlah semua subtotal; detail kosong → 0. */
export function hitungTotal(detail: { subtotal: number }[]): number {
	return detail.reduce((sum, d) => sum + d.subtotal, 0);
}

/** Kembalian = uang − total; uang < total → null (ditolak). */
export function hitungKembalian(uangDiterima: number, total: number): number | null {
	return uangDiterima < total ? null : uangDiterima - total;
}

/** Stok baru; hasil < 0 → throw (stok tidak boleh negatif). */
export function kurangiStok(stokSekarang: number, jumlah: number): number {
	const hasil = stokSekarang - jumlah;
	if (hasil < 0) throw new Error("Stok tidak boleh negatif");
	return hasil;
}

export type StatusStok = "tersedia" | "menipis" | "habis";

export function statusStok(jumlah: number): StatusStok {
	if (jumlah <= 0) return "habis";
	return jumlah <= 5 ? "menipis" : "tersedia";
}
