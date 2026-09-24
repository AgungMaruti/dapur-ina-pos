import { AdminShell } from "@/components/nav";
import { wajibPeran } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
	await wajibPeran("administrator");
	return <AdminShell>{children}</AdminShell>;
}
