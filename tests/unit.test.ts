// Unit test fungsi bisnis kritis — PRD §6. Jalankan: npm test
import test from "node:test";
import assert from "node:assert/strict";
import { formatRupiah, formatRupiahK, hitungKembalian, hitungTotal, kurangiStok, parseAngka, statusStok } from "../lib/format";
import { agregasiLaporan, awalBulan, persenNaik, ringkasHariIni } from "../lib/laporan";
import type { Trx } from "../lib/types";

// "Sekarang" tetap: Jumat 25 Sep 2026 12:00 WIB
const NOW = new Date("2026-09-25T05:00:00Z");
const trx = (tanggal: string, total: number): Trx => ({ id: tanggal, tanggal, total, nama: null });

test("UT-01 hitungTotal: jumlah semua subtotal", () => {
	assert.equal(hitungTotal([{ subtotal: 36000 }, { subtotal: 5000 }, { subtotal: 10000 }]), 51000);
});
test("UT-02 hitungTotal: detail kosong → 0", () => {
	assert.equal(hitungTotal([]), 0);
});
test("UT-03 hitungKembalian: uang > total → selisih", () => {
	assert.equal(hitungKembalian(60000, 51000), 9000);
});
test("UT-04 hitungKembalian: uang = total → 0", () => {
	assert.equal(hitungKembalian(51000, 51000), 0);
});
test("UT-05 hitungKembalian: uang < total → ditolak (null)", () => {
	assert.equal(hitungKembalian(50000, 51000), null);
});
test("UT-06 kurangiStok: stok berkurang sesuai jumlah", () => {
	assert.equal(kurangiStok(10, 3), 7);
});
test("UT-07 kurangiStok: jumlah = stok → 0", () => {
	assert.equal(kurangiStok(3, 3), 0);
});
test("UT-08 kurangiStok: jumlah > stok → ditolak, tidak negatif", () => {
	assert.throws(() => kurangiStok(2, 3), /Stok tidak boleh negatif/);
});
test("UT-09 statusStok: 0 → habis", () => {
	assert.equal(statusStok(0), "habis");
});
test("UT-10 statusStok: 1..5 → menipis (batas 5)", () => {
	assert.deepEqual([statusStok(1), statusStok(5)], ["menipis", "menipis"]);
});
test("UT-11 statusStok: >5 → tersedia (batas 6)", () => {
	assert.equal(statusStok(6), "tersedia");
});
test("UT-12 formatRupiah: pemisah ribuan titik", () => {
	assert.deepEqual([formatRupiah(51000), formatRupiah(0)], ["Rp 51.000", "Rp 0"]);
});
test("UT-13 formatRupiahK: ringkas 1 desimal, <1000 penuh", () => {
	assert.deepEqual([formatRupiahK(486000), formatRupiahK(54500), formatRupiahK(500)], ["Rp 486K", "Rp 54,5K", "Rp 500"]);
});
test("UT-14 parseAngka: ambil digit, kosong/huruf → 0", () => {
	assert.deepEqual([parseAngka("60.000"), parseAngka(""), parseAngka("abc")], [60000, 0, 0]);
});
test("UT-15 persenNaik: naik, turun, pembanding 0 → null", () => {
	assert.deepEqual([persenNaik(150, 100), persenNaik(50, 100), persenNaik(100, 0)], [50, -50, null]);
});
test("UT-16 awalBulan: batas bulan WIB (00:00 WIB = 17:00 UTC hari sebelumnya)", () => {
	assert.deepEqual([awalBulan(NOW, 0).toISOString(), awalBulan(NOW, 6).toISOString()], ["2026-08-31T17:00:00.000Z", "2026-02-28T17:00:00.000Z"]);
});
test("UT-17 agregasiLaporan bulanan: total = penjumlahan transaksi bulan berjalan", () => {
	const r = agregasiLaporan([trx("2026-09-25T04:00:00Z", 54000), trx("2026-09-22T03:00:00Z", 10000), trx("2026-08-10T03:00:00Z", 32000)], "bulan", NOW);
	assert.deepEqual([r.total, r.jumlah, r.persen, r.rataRata], [64000, 2, 100, 2560]);
});
test("UT-18 agregasiLaporan: tidak ada transaksi → total 0", () => {
	const r = agregasiLaporan([], "bulan", NOW);
	assert.deepEqual([r.total, r.jumlah, r.rataRata, r.persen], [0, 0, 0, null]);
});
test("UT-19 agregasiLaporan mingguan: minggu Senin–Minggu, batang per hari", () => {
	const r = agregasiLaporan([trx("2026-09-25T04:00:00Z", 54000), trx("2026-09-22T03:00:00Z", 10000), trx("2026-09-16T03:00:00Z", 32000)], "minggu", NOW);
	assert.deepEqual([r.total, r.persen, r.bars[1].total, r.bars[4].total, r.rataRata], [64000, 100, 10000, 54000, 12800]);
});
test("UT-20 agregasiLaporan: transaksi 00:30 WIB (17:30 UTC) masuk hari WIB berikutnya", () => {
	const r = ringkasHariIni([trx("2026-09-24T17:30:00Z", 7000), trx("2026-09-24T16:30:00Z", 3000)], NOW);
	assert.deepEqual([r.hari.total, r.kemarin.total], [7000, 3000]);
});
test("UT-21 agregasiLaporan: batas bulan WIB (1 Okt 00:00 WIB bukan September)", () => {
	const r = agregasiLaporan([trx("2026-09-30T17:00:00Z", 9999), trx("2026-09-30T16:59:00Z", 1)], "bulan", NOW);
	assert.deepEqual([r.total, r.jumlah], [1, 1]);
});
test("UT-22 ringkasHariIni: hari ini, kemarin, dan total bulan", () => {
	const r = ringkasHariIni([trx("2026-09-25T04:00:00Z", 54000), trx("2026-09-24T04:00:00Z", 10000), trx("2026-08-30T04:00:00Z", 5000)], NOW);
	assert.deepEqual([r.hari.total, r.hari.jumlah, r.kemarin.total, r.bulan], [54000, 1, 10000, 64000]);
});
