import { useEffect, useState } from 'react';
import { Plus, LayoutGrid, List } from 'lucide-react';
import { useLeadsStore, type Lead, type LeadStage, type LeadPayload } from '../stores/leadsStore';
import LeadCard, { STAGE_CONFIG, STAGE_ORDER } from '../components/LeadCard';
import LeadFormDialog from '../components/LeadFormDialog';

type ViewMode = 'kanban' | 'all';

export default function LeadsPage() {
  const { leads, loading, fetchLeads, createLead, updateLead, deleteLead } = useLeadsStore();
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [stageFilter, setStageFilter] = useState<LeadStage | 'all'>('all');

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleOpenCreate = () => {
    setEditingLead(null);
    setDialogOpen(true);
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setDialogOpen(true);
  };

  const handleSave = async (payload: LeadPayload) => {
    if (editingLead) {
      await updateLead(editingLead.id, payload);
    } else {
      await createLead(payload);
    }
  };

  const handleMoveStage = async (id: string, stage: LeadStage) => {
    await updateLead(id, { stage });
  };

  const handleDelete = async (id: string) => {
    await deleteLead(id);
  };

  // Pipeline stats
  const pipelineValue = leads
    .filter((l) => l.stage !== 'lost' && l.stage !== 'won')
    .reduce((sum, l) => sum + (l.estimated_value || 0), 0);

  const wonValue = leads
    .filter((l) => l.stage === 'won')
    .reduce((sum, l) => sum + (l.estimated_value || 0), 0);

  // Filter leads for list view
  const filteredLeads = stageFilter === 'all' ? leads : leads.filter((l) => l.stage === stageFilter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Leads Pipeline</h1>
          <p className="text-muted-foreground text-sm text-gray-400">
            {leads.length} leads -- Pipeline: ${pipelineValue.toLocaleString()} -- Won: ${wonValue.toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-[#1a1a3a] border border-[#2a2a4a] rounded-lg">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-l-lg transition-colors ${
                viewMode === 'kanban' ? 'bg-indigo-600/20 text-indigo-400' : 'text-gray-400 hover:text-white'
              }`}
              title="Kanban view"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`p-2 rounded-r-lg transition-colors ${
                viewMode === 'all' ? 'bg-indigo-600/20 text-indigo-400' : 'text-gray-400 hover:text-white'
              }`}
              title="List view"
            >
              <List size={18} />
            </button>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 gradient-accent text-white rounded-lg hover:opacity-90 transition text-sm"
          >
            <Plus size={16} />
            Add Lead
          </button>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        /* Kanban View */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGE_ORDER.map((stage) => {
            const config = STAGE_CONFIG[stage];
            const stageLeads = leads.filter((l) => l.stage === stage);
            return (
              <div key={stage} className="flex-shrink-0 w-72">
                {/* Column header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${config.bg.replace('/20', '')}`} />
                    <span className={`text-sm font-medium ${config.color}`}>
                      {config.label}
                    </span>
                    <span className="text-xs text-gray-500 bg-[#1a1a3a] px-1.5 py-0.5 rounded">
                      {stageLeads.length}
                    </span>
                  </div>
                </div>

                {/* Cards */}
                <div className="space-y-2 min-h-[100px]">
                  {stageLeads.length === 0 ? (
                    <div className="border border-dashed border-[#2a2a4a] rounded-lg p-4 text-center text-xs text-gray-500">
                      No leads
                    </div>
                  ) : (
                    stageLeads.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        onEdit={handleEdit}
                        onMoveStage={handleMoveStage}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List/All View */
        <div>
          {/* Stage filter tabs */}
          <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
            <button
              onClick={() => setStageFilter('all')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex-shrink-0 ${
                stageFilter === 'all'
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-gray-400 hover:bg-[#1a1a3a] border border-transparent'
              }`}
            >
              All ({leads.length})
            </button>
            {STAGE_ORDER.map((stage) => {
              const config = STAGE_CONFIG[stage];
              const count = leads.filter((l) => l.stage === stage).length;
              return (
                <button
                  key={stage}
                  onClick={() => setStageFilter(stage)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex-shrink-0 ${
                    stageFilter === stage
                      ? `${config.bg} ${config.color} border border-current/30`
                      : 'text-gray-400 hover:bg-[#1a1a3a] border border-transparent'
                  }`}
                >
                  {config.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Grid of cards */}
          {filteredLeads.length === 0 ? (
            <div className="glass rounded-xl p-12 text-center">
              <h3 className="text-lg font-medium text-white mb-2">No leads found</h3>
              <p className="text-gray-400 mb-4">
                {stageFilter === 'all' ? 'Start by adding your first lead.' : 'No leads in this stage.'}
              </p>
              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-2 px-4 py-2 gradient-accent text-white rounded-lg hover:opacity-90 transition text-sm"
              >
                <Plus size={16} />
                Add Lead
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredLeads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onEdit={handleEdit}
                  onMoveStage={handleMoveStage}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Form dialog */}
      <LeadFormDialog
        open={dialogOpen}
        lead={editingLead}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
