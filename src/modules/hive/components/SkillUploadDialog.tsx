import { useCallback, useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Upload } from 'lucide-react';
import { useSkillStore } from '../stores/skillStore';

interface SkillUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SkillUploadDialog({ open, onOpenChange }: SkillUploadDialogProps) {
  const uploadSkill = useSkillStore((s) => s.uploadSkill);
  const [scope, setScope] = useState<'global' | 'library'>('library');
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.md')) {
      setFile(droppedFile);
      setError(null);
    } else {
      setError('Please upload a .md file');
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!file) {return;}
    setUploading(true);
    setError(null);
    try {
      await uploadSkill(file, scope);
      onOpenChange(false);
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Skill</DialogTitle>
          <DialogDescription>
            Upload a SKILL.md file from skills.sh, ClawHub, or your own collection.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              dragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('skill-file-input')?.click()}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            {file ? (
              <p className="text-sm font-medium">{file.name}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Drop a .md file here or click to browse
              </p>
            )}
            <input
              id="skill-file-input"
              type="file"
              accept=".md"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          <div className="space-y-2">
            <Label>Scope</Label>
            <RadioGroup value={scope} onValueChange={(v: string) => setScope(v as 'global' | 'library')} className="flex gap-4">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="global" id="upload-scope-global" />
                <Label htmlFor="upload-scope-global" className="font-normal">Global</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="library" id="upload-scope-library" />
                <Label htmlFor="upload-scope-library" className="font-normal">Library</Label>
              </div>
            </RadioGroup>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!file || uploading}>
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
