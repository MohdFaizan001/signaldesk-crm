import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Select, Textarea } from '../../components/ui';
import { teamMembers } from '../../data/mockData';
import type { Lead } from '../../types';

const leadSchema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(5, 'Phone is required'),
  company: z.string().min(1, 'Company is required'),
  jobTitle: z.string().min(1, 'Job title is required'),
  source: z.enum(['website', 'referral', 'linkedin', 'cold-call', 'email-campaign', 'trade-show', 'partner']),
  status: z.enum(['new', 'contacted', 'interested', 'negotiation', 'converted', 'lost']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  assignedToId: z.string().min(1, 'Assign to a team member'),
  dealValue: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
  location: z.string().optional(),
  website: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadSchema>;

interface LeadFormProps {
  lead?: Lead;
  onSubmit: (data: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
}

export function LeadForm({ lead, onSubmit, onCancel }: LeadFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema) as any,
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
      assignedToId: teamMembers[0].id,
    },
  });

  const onFormSubmit = async (data: LeadFormData) => {
    const member = teamMembers.find((m) => m.id === data.assignedToId);
    await onSubmit({
      ...data,
      assignedTo: member?.name ?? '',
      dealValue: data.dealValue || undefined,
      notes: data.notes || undefined,
      location: data.location || undefined,
      website: data.website || undefined,
    } as Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>);
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
        <Input label="Deal Value ($)" type="number" {...register('dealValue')} placeholder="50000" />
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
          { value: 'critical', label: 'Critical' },
        ]} />
        <Select label="Assigned To" {...register('assignedToId')} options={
          teamMembers.map((m) => ({ value: m.id, label: m.name }))
        } />
      </div>
      <Textarea label="Notes" {...register('notes')} rows={3} placeholder="Additional notes about this lead..." />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={isSubmitting}>{lead ? 'Save Changes' : 'Create Lead'}</Button>
      </div>
    </form>
  );
}
