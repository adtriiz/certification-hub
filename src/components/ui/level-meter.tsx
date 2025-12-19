import { cn } from "@/lib/utils";

export const getLevelIndex = (level: string): number => {
    const levels = ["entry-level", "intermediate", "advanced", "expert"];
    return levels.indexOf(level.toLowerCase());
};

interface LevelMeterProps {
    level: string;
}


export const LevelMeter = ({ level }: LevelMeterProps) => {
    const index = getLevelIndex(level);
    const segments = 4;

    // Defined colors for each level
    const levelColors = [
        "bg-emerald-500", // Entry-level
        "bg-blue-500",    // Intermediate
        "bg-indigo-500",  // Advanced
        "bg-rose-500"     // Expert
    ];

    const activeColor = levelColors[index] || "bg-primary";

    return (
        <div className="flex items-center gap-1">
            <div className="flex gap-0.5">
                {Array.from({ length: segments }).map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            "h-3 w-1.5 rounded-sm transition-colors",
                            i <= index ? activeColor : "bg-border"
                        )}
                    />
                ))}
            </div>
            <span className="ml-1.5 text-xs text-muted-foreground capitalize">{level}</span>
        </div>
    );
};
