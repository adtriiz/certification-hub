import { cn } from "@/lib/utils";

interface QualitySealProps {
    quality: string;
}

export const QualitySeal = ({ quality }: QualitySealProps) => {
    const getConfig = () => {
        // Handle numeric values (1-5) even if they come as strings
        const numQuality = parseInt(quality, 10);

        // Match explicit string values or numeric range
        if (quality === "5" || numQuality === 5) {
            return { color: "text-purple-600", bg: "bg-purple-100", ring: "ring-purple-200", label: "★★★★★" };
        }
        if (quality === "4" || numQuality === 4) {
            return { color: "text-emerald-600", bg: "bg-emerald-100", ring: "ring-emerald-200", label: "★★★★" };
        }
        if (quality === "3" || numQuality === 3) {
            return { color: "text-blue-600", bg: "bg-blue-100", ring: "ring-blue-200", label: "★★★" };
        }
        if (quality === "2" || numQuality === 2) {
            return { color: "text-amber-600", bg: "bg-amber-100", ring: "ring-amber-200", label: "★★" };
        }
        if (quality === "1" || numQuality === 1) {
            return { color: "text-slate-500", bg: "bg-slate-100", ring: "ring-slate-200", label: "★" };
        }

        // Fallback or legacy values
        switch (quality.toLowerCase()) {
            case "high":
                return { color: "text-success", bg: "bg-success/10", ring: "ring-success/20", label: "High" };
            case "medium":
                return { color: "text-warning", bg: "bg-warning/10", ring: "ring-warning/20", label: "Avg" };
            case "low":
                return { color: "text-muted-foreground", bg: "bg-muted", ring: "ring-border", label: "Low" };
            default:
                return { color: "text-muted-foreground", bg: "bg-muted", ring: "ring-border", label: "–" };
        }
    };

    const config = getConfig();

    return (
        <div className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full ring-1",
            config.bg,
            config.ring
        )}>
            <span className={cn("text-xs font-medium", config.color)}>{config.label}</span>
        </div>
    );
};
