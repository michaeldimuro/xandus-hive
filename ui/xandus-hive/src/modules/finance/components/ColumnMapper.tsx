import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const TRANSACTION_FIELDS = [
  { value: '__skip__', label: '-- Skip --' },
  { value: 'date', label: 'Date' },
  { value: 'amount', label: 'Amount' },
  { value: 'description', label: 'Description' },
  { value: 'category', label: 'Category' },
] as const;

export type MappableField = 'date' | 'amount' | 'description' | 'category';

export type ColumnMapping = Record<number, MappableField | '__skip__'>;

interface ColumnMapperProps {
  headers: string[];
  mapping: ColumnMapping;
  onMappingChange: (mapping: ColumnMapping) => void;
}

export function ColumnMapper({ headers, mapping, onMappingChange }: ColumnMapperProps) {
  const handleChange = (colIndex: number, value: string) => {
    const next = { ...mapping, [colIndex]: value as MappableField | '__skip__' };
    onMappingChange(next);
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Map CSV columns to transaction fields</Label>
      <div className="grid gap-3">
        {headers.map((header, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground w-40 truncate font-mono" title={header}>
              {header}
            </span>
            <Select
              value={mapping[i] || '__skip__'}
              onValueChange={(v) => handleChange(i, v)}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRANSACTION_FIELDS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  );
}
