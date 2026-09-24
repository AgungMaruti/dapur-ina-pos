import { KasirShell } from "@/components/nav";
import { wajibPeran } from "@/lib/auth";

export default async function KasirLayout({ children }: { children: React.ReactNode }) {
	await wajibPeran("kasir");
	return <KasirShell>{children}</KasirShell>;
}
