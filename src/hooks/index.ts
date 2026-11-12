import { useState, useCallback, useEffect } from 'react';
import type { Lead, FollowUp } from '../types';
import * as api from '../services/mockService';
import { toast } from 'sonner';

// ─── Leads Hook ───
export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getLeads();
      setLeads(data);
    } catch {
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, []);

  const addLead = useCallback(async (data: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newLead = await api.createLead(data);
      setLeads((prev) => [newLead, ...prev]);
      toast.success('Lead created successfully');
      return newLead;
    } catch {
      toast.error('Failed to create lead');
      throw new Error('Failed to create lead');
    }
  }, []);

  const editLead = useCallback(async (id: string, data: Partial<Lead>) => {
    try {
      const updated = await api.updateLead(id, data);
      setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)));
      toast.success('Lead updated successfully');
      return updated;
    } catch {
      toast.error('Failed to update lead');
      throw new Error('Failed to update lead');
    }
  }, []);

  const removeLead = useCallback(async (id: string) => {
    try {
      await api.deleteLead(id);
      setLeads((prev) => prev.filter((l) => l.id !== id));
      toast.success('Lead deleted');
    } catch {
      toast.error('Failed to delete lead');
    }
  }, []);

  const updateStatus = useCallback(async (id: string, status: Lead['status']) => {
    try {
      const updated = await api.updateLeadStatus(id, status);
      setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)));
      toast.success(`Status updated to ${status}`);
      return updated;
    } catch {
      toast.error('Failed to update status');
      throw new Error('Failed to update status');
    }
  }, []);

  return { leads, loading, fetchLeads, addLead, editLead, removeLead, updateStatus };
}

// ─── Follow-ups Hook ───
export function useFollowUps() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFollowUps = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getFollowUps();
      setFollowUps(data);
    } catch {
      toast.error('Failed to load follow-ups');
    } finally {
      setLoading(false);
    }
  }, []);

  const addFollowUp = useCallback(async (data: Omit<FollowUp, 'id'>) => {
    try {
      const created = await api.createFollowUp(data);
      setFollowUps((prev) => [created, ...prev]);
      toast.success('Follow-up created');
      return created;
    } catch {
      toast.error('Failed to create follow-up');
      throw new Error('Failed to create follow-up');
    }
  }, []);

  const complete = useCallback(async (id: string) => {
    try {
      const updated = await api.completeFollowUp(id);
      setFollowUps((prev) => prev.map((f) => (f.id === id ? updated : f)));
      toast.success('Follow-up marked as complete');
    } catch {
      toast.error('Failed to complete follow-up');
    }
  }, []);

  return { followUps, loading, fetchFollowUps, addFollowUp, complete };
}

// ─── Dark Mode Hook ───
export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('signaldesk-theme') === 'dark';
    }
    return false;
  });

  // Apply dark class on initial mount
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem('signaldesk-theme', next ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', next);
      return next;
    });
  }, []);

  return { isDark, toggle };
}

// ─── Mobile sidebar hook ───
export function useMobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = useCallback(() => setIsOpen((p) => !p), []);
  const close = useCallback(() => setIsOpen(false), []);
  return { isOpen, toggle, close };
}
