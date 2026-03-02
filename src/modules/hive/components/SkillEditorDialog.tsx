import { useEffect, useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useSkillStore, type SkillFull } from '../stores/skillStore';

interface SkillEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skill?: SkillFull | null;
}

export function SkillEditorDialog({ open, onOpenChange, skill }: SkillEditorDialogProps) {
  const saveSkill = useSkillStore((s) => s.saveSkill);
  const [name, setName] = useState('');
  const [scope, setScope] = useState<'global' | 'library'>('library');
  const [content, setContent] = useState('');

  const isEdit = !!skill;

  useEffect(() => {
    if (skill) {
      setName(skill.name);
      setScope(skill.scope);
      setContent(skill.content);
    } else {
      setName('');
      setScope('library');
      setContent('---\nname: \ndescription: \n---\n\n');
    }
  }, [skill, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) {return;}
    saveSkill(name.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'), scope, content);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Skill' : 'Create Skill'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the skill definition.' : 'Create a new SKILL.md file.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="skill-name">Name</Label>
            <Input
              id="skill-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-skill"
              disabled={isEdit}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Scope</Label>
            <RadioGroup value={scope} onValueChange={(v: string) => setScope(v as 'global' | 'library')} className="flex gap-4">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="global" id="scope-global" disabled={isEdit} />
                <Label htmlFor="scope-global" className="font-normal">Global</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="library" id="scope-library" disabled={isEdit} />
                <Label htmlFor="scope-library" className="font-normal">Library</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="skill-content">SKILL.md Content</Label>
            <Textarea
              id="skill-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="---\nname: my-skill\ndescription: What this skill does\n---\n\nInstructions here..."
              className="font-mono text-xs min-h-[350px]"
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || !content.trim()}>
              {isEdit ? 'Save Changes' : 'Create Skill'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
