"use client";

import { FileText } from "lucide-react";

/** Export PDF = dialog cetak browser ("Simpan sebagai PDF"); nav/tombol disembunyikan lewat print:hidden. */
export function PrintButton({ className }: { className?: string }) {
	return (
		<button type="button" onClick={() => window.print()} className={className}>
			<FileText aria-hidden className="size-[18px]" strokeWidth={2} />
			Export PDF
		</button>
	);
}
