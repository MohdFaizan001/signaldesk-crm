import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext, closestCorners, PointerSensor, useSensor, useSensors,
  type DragEndEvent, DragOverlay, type DragStartEvent
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { GripVertical, Building2, DollarSign } from 'lucide-react';
import { PriorityBadge, Avatar, LoadingSpinner } from '../../components/ui';
import { useLeads } from '../../hooks';
import { formatCurrency } from '../../utils';
import type { Lead, LeadStatus } from '../../types';

const STAGES: { id: LeadStatus; label: string; color: string; dotColor: string }[] = [
  { id: 'new', label: 'New', color: 'border-t-blue-500', dotColor: 'bg-blue-500' },
  { id: 'contacted', label: 'Contacted', color: 'border-t-amber-500', dotColor: 'bg-amber-500' },
  { id: 'interested', label: 'Interested', color: 'border-t-emerald-500', dotColor: 'bg-emerald-500' },
  { id: 'negotiation', label: 'Negotiation', color: 'border-t-purple-500', dotColor: 'bg-purple-500' },
  { id: 'converted', label: 'Converted', color: 'border-t-green-500', dotColor: 'bg-green-500' },
  { id: 'lost', label: 'Lost', color: 'border-t-red-500', dotColor: 'bg-red-500' },
];

export function PipelinePage() {
  const { leads, loading, fetchLeads, updateStatus } = useLeads();
  const navigate = useNavigate();
  const [activeDrag, setActiveDrag] = useState<Lead | null>(null);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const getStageLeads = useCallback(
    (stageId: LeadStatus) => leads.filter((l) => l.status === stageId),
    [leads]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const lead = leads.find((l) => l.id === event.active.id);
    if (lead) setActiveDrag(lead);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDrag(null);
    const { active, over } = event;
    if (!over) return;

    const leadId = active.id as string;
    const overId = over.id as string;

    // Check if dropped on a stage column directly
    const targetStage = STAGES.find((s) => s.id === overId);
    if (targetStage) {
      const lead = leads.find((l) => l.id === leadId);
      if (lead && lead.status !== targetStage.id) {
        updateStatus(leadId, targetStage.id);
      }
      return;
    }

    // Dropped on another lead card — determine that card's stage
    const overLead = leads.find((l) => l.id === overId);
    if (overLead) {
      const draggedLead = leads.find((l) => l.id === leadId);
      if (draggedLead && draggedLead.status !== overLead.status) {
        updateStatus(leadId, overLead.status);
      }
    }
  };

  if (loading) return <LoadingSpinner />;

  const totalValue = leads.reduce((sum, l) => sum + (l.dealValue || 0), 0);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Sales Pipeline</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {leads.length} leads · Pipeline value: {formatCurrency(totalValue)}
          </p>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 lg:mx-0 lg:px-0">
          {STAGES.map((stage) => {
            const stageLeads = getStageLeads(stage.id);
            const stageValue = stageLeads.reduce((sum, l) => sum + (l.dealValue || 0), 0);
            return (
              <StageColumn
                key={stage.id}
                stage={stage}
                leads={stageLeads}
                totalValue={stageValue}
                onCardClick={(id) => navigate(`/leads/${id}`)}
              />
            );
          })}
        </div>

        <DragOverlay>
          {activeDrag && <PipelineCard lead={activeDrag} isDragging />}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function StageColumn({ stage, leads, totalValue, onCardClick }: {
  stage: typeof STAGES[number]; leads: Lead[]; totalValue: number; onCardClick: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-[280px] lg:flex-1 lg:min-w-[220px] ${isOver ? 'ring-2 ring-accent/30 rounded-xl' : ''}`}
    >
      <div className={`bg-bg-surface border border-border rounded-xl border-t-2 ${stage.color}`}>
        {/* Header */}
        <div className="px-3 py-3 border-b border-border-light">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${stage.dotColor}`} />
              <h3 className="text-sm font-semibold text-text-primary">{stage.label}</h3>
              <span className="text-xs text-text-muted bg-bg-primary px-1.5 py-0.5 rounded">{leads.length}</span>
            </div>
          </div>
          {totalValue > 0 && (
            <p className="text-xs text-text-muted mt-1">{formatCurrency(totalValue)}</p>
          )}
        </div>

        {/* Cards */}
        <div className="p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-280px)] overflow-y-auto">
          <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
            {leads.map((lead) => (
              <SortableCard key={lead.id} lead={lead} onClick={() => onCardClick(lead.id)} />
            ))}
          </SortableContext>
          {leads.length === 0 && (
            <div className="text-center py-8 text-xs text-text-muted">
              Drop leads here
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SortableCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <PipelineCard lead={lead} onClick={onClick} dragListeners={listeners} />
    </div>
  );
}

function PipelineCard({ lead, onClick, dragListeners, isDragging }: {
  lead: Lead; onClick?: () => void; dragListeners?: Record<string, unknown>; isDragging?: boolean;
}) {
  return (
    <div
      className={`bg-bg-surface border border-border rounded-lg p-3 hover:border-accent/30 transition-colors cursor-pointer group ${isDragging ? 'shadow-lg ring-2 ring-accent/20' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar name={lead.fullName} size="sm" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{lead.fullName}</p>
            <p className="text-[11px] text-text-muted truncate flex items-center gap-1">
              <Building2 className="w-3 h-3 shrink-0" /> {lead.company}
            </p>
          </div>
        </div>
        <div {...(dragListeners || {})} className="cursor-grab text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-center justify-between mt-2">
        <PriorityBadge priority={lead.priority} />
        {lead.dealValue && (
          <span className="text-xs font-medium text-text-primary flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-text-muted" />
            {formatCurrency(lead.dealValue).replace('$', '')}
          </span>
        )}
      </div>
    </div>
  );
}
