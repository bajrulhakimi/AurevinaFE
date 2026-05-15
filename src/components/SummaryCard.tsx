import type { LucideIcon } from "lucide-react";

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
}

export default function SummaryCard({ title, value, icon: Icon, color }: SummaryCardProps) {
  const iconBg = color.replace("border-l-", "bg-").replace("-500", "-100");
  const iconText = color.replace("border-l-", "text-").replace("-500", "-600");

  return (
    <div className={`group rounded-3xl border border-white bg-white/95 p-6 shadow-sm ring-1 ring-slate-900/5 transition hover:-translate-y-0.5 hover:shadow-xl ${color}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-bold tracking-normal text-slate-950">{value}</p>
        </div>
        <div className={`rounded-2xl p-3 ${iconBg} transition group-hover:scale-105`}>
          <Icon className={`h-6 w-6 ${iconText}`} />
        </div>
      </div>
      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full w-2/3 rounded-full ${iconBg.replace("-100", "-300")}`} />
      </div>
    </div>
  );
}
