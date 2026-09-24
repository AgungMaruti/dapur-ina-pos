import { getProduk } from "@/lib/data";
import { PesananView } from "./pesanan-view";

export default async function KasirPesananPage() {
	return <PesananView produk={await getProduk()} />;
}
