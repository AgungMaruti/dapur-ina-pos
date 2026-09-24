import { cache } from "react";
import { redirect } from "next/navigation";
import { db, supabaseAuth } from "./supabase";
import type { Peran } from "./types";

export interface Sesi {
	id: string;
	email: string;
	nama: string;
	peran: Peran;
}

export const beranda = (peran: Peran) => (peran === "kasir" ? "/kasir/menu?category=makanan" : "/admin/stok");

/** Sumber kebenaran peran = tabel `profil` (bukan metadata JWT). Pelanggan tidak punya akses. */
export const getSesi = cache(async (): Promise<Sesi | null> => {
	const {
		data: { user },
	} = await (await supabaseAuth()).auth.getUser();
	if (!user) return null;
	const { data: p } = await db().from("profil").select("nama,peran").eq("id", user.id).maybeSingle();
	if (!p || (p.peran !== "kasir" && p.peran !== "administrator")) return null;
	return { id: user.id, email: user.email ?? "", nama: p.nama, peran: p.peran };
});

/** Guard server: belum login → /login; peran salah → dikembalikan ke beranda perannya sendiri. */
export async function wajibPeran(peran: Peran): Promise<Sesi> {
	const s = await getSesi();
	if (!s) redirect("/login");
	if (s.peran !== peran) redirect(beranda(s.peran));
	return s;
}
