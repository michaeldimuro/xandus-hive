import { useEffect, useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useSkillStore } from '../stores/skillStore';

interface SkillAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentId: string;
  currentSkills: string[];
}

export function SkillAssignDialog({ open, onOpenChange, agentId, currentSkills }: SkillAssignDialogProps) {
  const skills = useSkillStore((s) => s.skills);
  const fetchSkills = useSkillStore((s) => s.fetchSkills);
  const assignSkills = useSkillStore((s) => s.assignSkills);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      fetchSkills();
      setSelected(new Set(currentSkills));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const librarySkills = skills.filter((s) => s.scope === 'library');

  const toggle = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {next.delete(name);}
      else {next.add(name);}
      return next;
    });
  };

  const handleSave = () => {
    assignSkills(agentId, Array.from(selected));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Skills</DialogTitle>
          <DialogDescription>
            Select which library skills this agent can use. Global skills are always inherited.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {librarySkills.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No library skills available. Create one in the Skills page.
            </p>
          )}
          {librarySkills.map((skill) => (
            <div key={skill.name} className="flex items-start gap-3 p-2 rounded hover:bg-muted/50">
              <Checkbox
                id={`skill-${skill.name}`}
                checked={selected.has(skill.name)}
                onCheckedChange={() => toggle(skill.name)}
              />
              <div className="flex-1">
                <Label htmlFor={`skill-${skill.name}`} className="font-medium cursor-pointer">
                  {skill.name}
                </Label>
                {skill.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{skill.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
