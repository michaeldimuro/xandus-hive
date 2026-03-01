import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Trash2, Edit, BookOpen, WifiOff } from 'lucide-react';
import { useSkillStore, type SkillMeta } from '../stores/skillStore';
import { useOperationsStore } from '@/stores/operationsStore';
import { SkillEditorDialog } from '../components/SkillEditorDialog';
import { SkillUploadDialog } from '../components/SkillUploadDialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function SkillsPage() {
  const { skills, loading, fetchSkills, deleteSkill, getSkillContent, activeSkill, setActiveSkill } = useSkillStore();
  const isConnected = useOperationsStore((s) => s.isConnected);
  const [editorOpen, setEditorOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SkillMeta | null>(null);
  const [editTarget, setEditTarget] = useState<SkillMeta | null>(null);

  useEffect(() => { if (isConnected) {fetchSkills();} }, [isConnected, fetchSkills]);

  const handleEdit = (skill: SkillMeta) => {
    setEditTarget(skill);
    getSkillContent(skill.name, skill.scope);
  };

  // When activeSkill loads for editing, open the editor
  useEffect(() => {
    if (activeSkill && editTarget && activeSkill.name === editTarget.name) {
      setEditorOpen(true);
      setEditTarget(null);
    }
  }, [activeSkill, editTarget]);

  const handleCreate = () => {
    setActiveSkill(null);
    setEditorOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteSkill(deleteTarget.name, deleteTarget.scope);
      setDeleteTarget(null);
    }
  };

  const globalSkills = skills.filter((s) => s.scope === 'global');
  const librarySkills = skills.filter((s) => s.scope === 'library');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Skills</h1>
          <p className="text-sm text-muted-foreground">
            Manage reusable skills for your agents
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setUploadOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Skill
          </Button>
        </div>
      </div>

      {loading && skills.length === 0 && (
        !isConnected ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <WifiOff className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">Not connected</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Waiting for connection to Hive core...
              </p>
            </CardContent>
          </Card>
        ) : (
          <p className="text-sm text-muted-foreground">Loading skills...</p>
        )
      )}

      {!loading && skills.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">No skills yet</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Create a skill or upload one from skills.sh or ClawHub
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setUploadOpen(true)}>Upload</Button>
              <Button onClick={handleCreate}>Create Skill</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {globalSkills.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Global Skills
            <span className="ml-2 text-xs font-normal normal-case">(inherited by all agents)</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {globalSkills.map((skill) => (
              <SkillCard key={`${skill.scope}-${skill.name}`} skill={skill} onEdit={handleEdit} onDelete={setDeleteTarget} />
            ))}
          </div>
        </div>
      )}

      {librarySkills.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Library Skills
            <span className="ml-2 text-xs font-normal normal-case">(assignable per agent)</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {librarySkills.map((skill) => (
              <SkillCard key={`${skill.scope}-${skill.name}`} skill={skill} onEdit={handleEdit} onDelete={setDeleteTarget} />
            ))}
          </div>
        </div>
      )}

      <SkillEditorDialog open={editorOpen} onOpenChange={setEditorOpen} skill={activeSkill} />
      <SkillUploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open: boolean) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete skill?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the "{deleteTarget?.name}" skill and all its supporting files.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SkillCard({ skill, onEdit, onDelete }: { skill: SkillMeta; onEdit: (s: SkillMeta) => void; onDelete: (s: SkillMeta) => void }) {
  return (
    <Card className="group">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base font-medium">{skill.name}</CardTitle>
          <Badge
            variant="outline"
            className={skill.scope === 'global'
              ? 'bg-amber-600/20 text-amber-400 border-amber-600/30'
              : 'bg-indigo-600/20 text-indigo-400 border-indigo-600/30'}
          >
            {skill.scope}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {skill.description || 'No description'}
        </p>
        {skill.supportingFiles.length > 0 && (
          <p className="text-xs text-muted-foreground mb-3">
            {skill.supportingFiles.length} supporting file{skill.supportingFiles.length > 1 ? 's' : ''}
          </p>
        )}
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="sm" variant="ghost" onClick={() => onEdit(skill)}>
            <Edit className="h-3.5 w-3.5 mr-1" /> Edit
          </Button>
          <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => onDelete(skill)}>
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
