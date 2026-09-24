import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

/** Klien sesi login (anon key + cookie). Hanya untuk auth: login, logout, baca user. */
export async function supabaseAuth() {
	const store = await cookies();
	return createServerClient(URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
		cookies: {
			getAll: () => store.getAll(),
			setAll: (list) => {
				try {
					for (const { name, value, options } of list) store.set(name, value, options);
				} catch {
					/* dipanggil dari Server Component: middleware yang me-refresh cookie */
				}
			},
		},
	});
}

/**
 * Klien data (service role) — melewati RLS, jadi WAJIB hanya dipakai di server
 * setelah peran user diverifikasi (getSesi/wajibPeran). RLS di DB nyala tanpa policy,
 * sehingga browser dengan anon key tidak bisa membaca/menulis apa pun.
 */
let admin: SupabaseClient | undefined;
export function db(): SupabaseClient {
	return (admin ??= createClient(URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
		auth: { persistSession: false, autoRefreshToken: false },
	}));
}

export const urlGambar = (idProduk: string, versi: string) =>
	`${URL}/storage/v1/object/public/produk/${idProduk}.jpg?v=${Date.parse(versi) || 0}`;
