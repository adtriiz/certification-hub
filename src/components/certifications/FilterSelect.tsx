import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterSelectProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
}

export const FilterSelect = ({
  label,
  value,
  options,
  onChange,
  placeholder = "All",
}: FilterSelectProps) => {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[160px] h-9 bg-background/60 border-border/60 text-sm rounded-lg hover:border-primary/40 transition-colors">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="rounded-lg border-border/60">
          <SelectItem value="all" className="rounded-md">{placeholder}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option} value={option} className="rounded-md">
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
