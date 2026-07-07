import Link from "next/link";

export default function CntsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <nav className="flex gap-4 border-b border-border bg-white px-6 py-3 text-sm">
        <Link href="/cnts/wc-01" className="hover:text-primary">
          Supervision
        </Link>
        <Link href="/cnts/wc-03" className="hover:text-primary">
          Decision Policies
        </Link>
        <Link href="/cnts/wc-04" className="hover:text-primary">
          Console labo
        </Link>
      </nav>
      {children}
    </div>
  );
}
