import { getProduk } from "@/lib/data";
import { PembayaranView } from "./pembayaran-view";

export default async function KasirPembayaranPage({ searchParams }: { searchParams: Promise<{ method?: string }> }) {
	const { method } = await searchParams;
	return <PembayaranView produk={await getProduk()} qr={method === "qr"} />;
}
