"use client";

import { useSyncExternalStore } from "react";
import type { CartLine, ProdukView } from "./types";

/** Draft pesanan kasir — satu-satunya state client. Mulai KOSONG; harga/nama/stok selalu dari DB. */
export interface CartState {
	items: CartLine[];
	nama: string;
}

const KEY = "dapur-ina-draft";
const KOSONG: CartState = { items: [], nama: "" };
let state = KOSONG;
let dibaca = false;
const subs = new Set<() => void>();

function baca() {
	if (dibaca || typeof window === "undefined") return;
	dibaca = true;
	try {
		const p = JSON.parse(localStorage.getItem(KEY) ?? "null");
		if (p && Array.isArray(p.items)) {
			state = {
				items: p.items.filter((i: CartLine) => typeof i?.idProduk === "string" && i.jumlah > 0),
				nama: String(p.nama ?? ""),
			};
		}
	} catch {
		/* rusak → mulai kosong */
	}
}

function set(next: CartState) {
	state = next;
	try {
		localStorage.setItem(KEY, JSON.stringify(next));
	} catch {
		/* penuh / diblokir: draft tetap hidup di memori */
	}
	subs.forEach((f) => f());
}

export function useCart(): CartState {
	return useSyncExternalStore(
		(f) => {
			subs.add(f);
			return () => subs.delete(f);
		},
		() => (baca(), state),
		() => KOSONG,
	);
}

/** Set jumlah (dijepit ke stok). ≤ 0 → hapus baris. */
export function setJumlah(idProduk: string, jumlah: number, stok: number) {
	const j = Math.min(Math.floor(jumlah), stok);
	const ada = state.items.some((i) => i.idProduk === idProduk);
	const items =
		j <= 0
			? state.items.filter((i) => i.idProduk !== idProduk)
			: ada
				? state.items.map((i) => (i.idProduk === idProduk ? { ...i, jumlah: j } : i))
				: [...state.items, { idProduk, jumlah: j }];
	set({ ...state, items });
}

export const tambah = (p: ProdukView) => {
	const ada = state.items.find((i) => i.idProduk === p.id)?.jumlah ?? 0;
	if (ada < p.jumlah) setJumlah(p.id, ada + 1, p.jumlah);
};
export const hapus = (idProduk: string) => set({ ...state, items: state.items.filter((i) => i.idProduk !== idProduk) });
export const setNama = (nama: string) => set({ ...state, nama });
export const kosongkan = () => set(KOSONG);

/** Gabungkan draft dengan data produk terbaru; baris untuk produk yang sudah tidak ada dibuang. */
export function gabung(items: CartLine[], produk: ProdukView[]) {
	const lines = items.flatMap((i) => {
		const p = produk.find((x) => x.id === i.idProduk);
		return p ? [{ produk: p, jumlah: i.jumlah, subtotal: p.harga * i.jumlah }] : [];
	});
	return { lines, total: lines.reduce((s, l) => s + l.subtotal, 0) };
}
