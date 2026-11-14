import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Select, Textarea } from '../../components/ui';
import type { Lead, Profile } from '../../types';
import type { LeadInput } from '../../services/api';

const leadSchema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(5, 'Phone is required'),
  company: z.string().min(1, 'Company is required'),
  jobTitle: z.string().min(1, 'Job title is required'),
  source: z.enum(['website', 'referral', 'linkedin', 'cold-call', 'email-campaign', 'trade-show', 'partner']),
  status: z.enum(['new', 'contacted', 'interested', 'negotiation', 'converted', 'lost']),
  priority: z.enum(['low', 'medium', 'high']),
  assignedToId: z.string().min(1, 'Assign to a team member'),
  dealValue: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
  location: z.string().optional(),
  website: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadSchema>;

interface LeadFormProps {
  lead?: Lead;
  profiles: Profile[];
  currentUserId: string;
  isAdmin: boolean;
  onSubmit: (data: LeadInput) => Promise<void>;
  onCancel: () => void;
}

export function LeadForm({ lead, profiles, currentUserId, isAdmin, onSubmit, onCancel }: LeadFormProps) {
  const assignableProfiles = isAdmin ? profiles : profiles.filter((profile) => profile.id === currentUserId);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema) as never,
    defaultValues: lead ? {
      fullName: lead.fullName,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      jobTitle: lead.jobTitle,
      source: lead.source,
      status: lead.status,
      priority: lead.priority,
      assignedToId: lead.assignedToId,
      dealValue: lead.dealValue ?? 0,
      notes: lead.notes ?? '',
      location: lead.location ?? '',
      website: lead.website ?? '',
    } : {
      status: 'new',
      priority: 'medium',
      source: 'website',
      assignedToId: currentUserId,
    },
  });

  const onFormSubmit = async (data: LeadFormData) => {
    await onSubmit({
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      company: data.company,
      jobTitle: data.jobTitle,
      source: data.source,
      status: data.status,
      priority: data.priority,
      assignedToId: data.assignedToId,
      dealValue: data.dealValue || undefined,
      notes: data.notes || undefined,
      location: data.location || undefined,
      website: data.website || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Full Name" {...register('fullName')} error={errors.fullName?.message} placeholder="John Smith" />
        <Input label="Email" type="email" {...register('email')} error={errors.email?.message} placeholder="john@company.com" />
        <Input label="Phone" {...register('phone')} error={errors.phone?.message} placeholder="+1 (555) 000-0000" />
        <Input label="Company" {...register('company')} error={errors.company?.message} placeholder="Acme Corp" />
        <Input label="Job Title" {...register('jobTitle')} error={errors.jobTitle?.message} placeholder="VP of Sales" />
        <Input label="Location" {...register('location')} placeholder="San Francisco, CA" />
        <Input label="Website" {...register('website')} placeholder="company.com" />
        <Input label="Deal Value ($)" type="number" step="0.01" {...register('dealValue')} placeholder="50000" />
        <Select label="Lead Source" {...register('source')} options={[
          { value: 'website', label: 'Website' },
          { value: 'referral', label: 'Referral' },
          { value: 'linkedin', label: 'LinkedIn' },
          { value: 'cold-call', label: 'Cold Call' },
          { value: 'email-campaign', label: 'Email Campaign' },
          { value: 'trade-show', label: 'Trade Show' },
          { value: 'partner', label: 'Partner' },
        ]} />
        <Select label="Status" {...register('status')} options={[
          { value: 'new', label: 'New' },
          { value: 'contacted', label: 'Contacted' },
          { value: 'interested', label: 'Interested' },
          { value: 'negotiation', label: 'Negotiation' },
          { value: 'converted', label: 'Converted' },
          { value: 'lost', label: 'Lost' },
        ]} />
        <Select label="Priority" {...register('priority')} options={[
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' },
        ]} />
        <Select
          label="Assigned To"
          {...register('assignedToId')}
          disabled={!isAdmin}
          options={assignableProfiles.map((profile) => ({ value: profile.id, label: profile.fullName || profile.email }))}
        />
      </div>
      <Textarea label="Notes" {...register('notes')} rows={3} placeholder="Additional notes about this lead..." />
      {!isAdmin && (
        <p className="text-[11px] text-text-muted">Only admins can assign leads to other team members.</p>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={isSubmitting}>{lead ? 'Save Changes' : 'Create Lead'}</Button>
      </div>
    </form>
  );
}
