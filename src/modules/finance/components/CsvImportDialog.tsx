import { useState, useRef } from 'react';
import { useFinanceStore } from '../stores/financeStore';
import type { FinancialAccount } from '../stores/financeStore';
import { ColumnMapper, type ColumnMapping, type MappableField } from './ColumnMapper';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Upload, FileSpreadsheet, CheckCircle2 } from 'lucide-react';

interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'upload' | 'preview' | 'map' | 'account' | 'result';

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) {return { headers: [], rows: [] };}
  const headers = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map(parseCsvLine);
  return { headers, rows };
}

export function CsvImportDialog({ open, onOpenChange }: CsvImportDialogProps) {
  const accounts = useFinanceStore((s) => s.accounts);
  const bulkCreateTransactions = useFinanceStore((s) => s.bulkCreateTransactions);

  const [step, setStep] = useState<Step>('upload');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [importCount, setImportCount] = useState(0);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep('upload');
    setHeaders([]);
    setRows([]);
    setMapping({});
    setSelectedAccountId('');
    setImportCount(0);
    setImporting(false);
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {reset();}
    onOpenChange(value);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {return;}

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { headers: h, rows: r } = parseCsv(text);
      setHeaders(h);
      setRows(r);

      // Auto-detect mapping based on header names
      const autoMap: ColumnMapping = {};
      h.forEach((header, i) => {
        const lower = header.toLowerCase();
        if (lower.includes('date')) {autoMap[i] = 'date';}
        else if (lower.includes('amount') || lower.includes('total') || lower.includes('debit') || lower.includes('credit'))
          {autoMap[i] = 'amount';}
        else if (lower.includes('desc') || lower.includes('memo') || lower.includes('payee') || lower.includes('name'))
          {autoMap[i] = 'description';}
        else if (lower.includes('categ') || lower.includes('type'))
          {autoMap[i] = 'category';}
        else {autoMap[i] = '__skip__';}
      });
      setMapping(autoMap);
      setStep('preview');
    };
    reader.readAsText(file);
  };

  const getMappedField = (field: MappableField): number | null => {
    for (const [colStr, mapped] of Object.entries(mapping)) {
      if (mapped === field) {return Number(colStr);}
    }
    return null;
  };

  const canImport = (): boolean => {
    const dateCol = getMappedField('date');
    const amountCol = getMappedField('amount');
    const descCol = getMappedField('description');
    return dateCol !== null && amountCol !== null && descCol !== null && !!selectedAccountId;
  };

  const handleImport = async () => {
    const dateCol = getMappedField('date');
    const amountCol = getMappedField('amount');
    const descCol = getMappedField('description');
    const catCol = getMappedField('category');

    if (dateCol === null || amountCol === null || descCol === null || !selectedAccountId) {return;}

    setImporting(true);
    try {
      const txs = rows
        .filter((row) => row[dateCol] && row[amountCol])
        .map((row) => {
          // Try to parse the amount, removing currency symbols and commas
          const rawAmount = row[amountCol].replace(/[$,]/g, '').trim();
          const amount = parseFloat(rawAmount) || 0;

          // Normalize date format
          let date = row[dateCol].trim();
          // If date is in MM/DD/YYYY, convert to YYYY-MM-DD
          const mdyMatch = date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
          if (mdyMatch) {
            date = `${mdyMatch[3]}-${mdyMatch[1].padStart(2, '0')}-${mdyMatch[2].padStart(2, '0')}`;
          }

          return {
            account_id: selectedAccountId,
            date,
            amount,
            description: row[descCol]?.trim() || 'Unknown',
            category: catCol !== null ? row[catCol]?.trim() || null : null,
            linked_entity_type: null,
            linked_entity_id: null,
            imported_from: 'csv' as const,
          };
        });

      const count = await bulkCreateTransactions(txs);
      setImportCount(count);
      setStep('result');
    } finally {
      setImporting(false);
    }
  };

  const previewRows = rows.slice(0, 5);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import CSV</DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Upload a CSV file with your transaction data.'}
            {step === 'preview' && 'Preview the first 5 rows of your CSV file.'}
            {step === 'map' && 'Map CSV columns to transaction fields.'}
            {step === 'account' && 'Select which account to import into.'}
            {step === 'result' && 'Import complete.'}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Select a CSV file to import</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button onClick={() => fileInputRef.current?.click()}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Choose File
            </Button>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === 'preview' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {rows.length} rows detected. Showing first {Math.min(5, rows.length)} rows:
            </p>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {headers.map((h, i) => (
                      <TableHead key={i} className="whitespace-nowrap text-xs">
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRows.map((row, ri) => (
                    <TableRow key={ri}>
                      {row.map((cell, ci) => (
                        <TableCell key={ci} className="text-xs whitespace-nowrap max-w-[200px] truncate">
                          {cell}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={reset}>Back</Button>
              <Button onClick={() => setStep('map')}>Next: Map Columns</Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 3: Column Mapping */}
        {step === 'map' && (
          <div className="space-y-4">
            <ColumnMapper headers={headers} mapping={mapping} onMappingChange={setMapping} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('preview')}>Back</Button>
              <Button onClick={() => setStep('account')} disabled={getMappedField('date') === null || getMappedField('amount') === null || getMappedField('description') === null}>
                Next: Select Account
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 4: Account Selection */}
        {step === 'account' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Import into account</Label>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a: FinancialAccount) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} {a.last_four ? `(****${a.last_four})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              {rows.length} transactions will be imported.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('map')}>Back</Button>
              <Button onClick={handleImport} disabled={!canImport() || importing}>
                {importing ? 'Importing...' : `Import ${rows.length} Transactions`}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 5: Result */}
        {step === 'result' && (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <CheckCircle2 className="h-12 w-12 text-emerald-400" />
            <div className="text-center">
              <p className="text-lg font-semibold">Import Complete</p>
              <p className="text-sm text-muted-foreground">
                Successfully imported {importCount} transactions.
              </p>
            </div>
            <Button onClick={() => handleOpenChange(false)}>Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
