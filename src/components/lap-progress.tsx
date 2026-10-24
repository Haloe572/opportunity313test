import { Check } from "lucide-react";
import mascot from "@/assets/mascot.png";
import { cn } from "@/lib/utils";

export function LapProgress({ laps, current }: { laps: string[]; current: number }) {
  const pct = laps.length > 1 ? (current / (laps.length - 1)) * 100 : 0;
  return (
    <div className="relative px-4 pt-10">
      <div className="road relative h-3 rounded-full">
        <div className="absolute inset-y-0 left-0 rounded-full bg-secondary transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />
      </div>
      <img
        src={mascot} alt="" width={1024} height={768}
        className="absolute top-0 h-10 w-auto -translate-x-1/2 transition-all duration-700 ease-out"
        style={{ left: `calc(1rem + (100% - 2rem) * ${pct / 100})` }}
      />
      <div className="relative -mt-[1.375rem] flex justify-between">
        {laps.map((l, i) => (
          <div key={l} className="flex w-0 flex-col items-center">
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors duration-500",
              i < current ? "border-secondary bg-secondary text-secondary-foreground" : i === current ? "border-secondary bg-card text-secondary" : "border-border bg-card text-muted-foreground",
            )}>
              {i < current ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className="mt-1.5 whitespace-nowrap text-[11px] font-semibold text-muted-foreground">{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
