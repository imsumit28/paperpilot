'use client';

import { useState } from 'react';
import { Plus, Users, Trash2 } from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CreateGroupModal } from '@/components/groups/CreateGroupModal';
import { useGroupsStore } from '@/store/useGroupsStore';

const EXAM_TYPE_COLORS: Record<string, string> = {
  'Mid Term': 'bg-blue-50 text-blue-700',
  'End Term': 'bg-purple-50 text-purple-700',
  'Class Test': 'bg-amber-50 text-amber-700',
  'Unit Test': 'bg-emerald-50 text-emerald-700',
  'Weekly Test': 'bg-orange-50 text-orange-700',
  'Practice Test': 'bg-pink-50 text-pink-700',
  'Annual Exam': 'bg-red-50 text-red-700',
};

export default function GroupsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const { groups, deleteGroup } = useGroupsStore();

  return (
    <div className="px-4 lg:px-0 pb-24 lg:pb-12">
      <Topbar title="My Groups" />

      <div className="flex items-end justify-between gap-4 mb-5 px-1 lg:px-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-subtle">
            Class organisation
          </p>
          <h1 className="mt-0.5 text-[28px] leading-tight tracking-[-0.02em] font-bold text-ink">
            My Groups
          </h1>
          <p className="mt-1 text-[14px] tracking-[-0.01em] text-ink-muted">
            {groups.length === 0
              ? 'Group papers by class, subject, and exam type.'
              : `${groups.length} group${groups.length !== 1 ? 's' : ''}.`}
          </p>
        </div>
        <Button iconLeft={<Plus className="h-4 w-4" />} onClick={() => setModalOpen(true)} className="shrink-0">
          Create Group
        </Button>
      </div>

      {groups.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Users className="h-8 w-8 mx-auto mb-3 text-ink-muted opacity-40" />
            <div className="text-lg font-semibold text-ink mb-1">No groups yet</div>
            <div className="text-sm text-ink-muted mb-5">
              Create a group by class, subject, and exam type to organise your papers.
            </div>
            <Button
              iconLeft={<Plus className="h-4 w-4" />}
              onClick={() => setModalOpen(true)}
            >
              Create Group
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {groups.map((group) => (
            <Card
              key={group.id}
              className="rounded-[24px] p-5 bg-white flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-extrabold text-[16px] leading-[140%] tracking-[-0.03em] text-ink line-clamp-2">
                    {group.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => deleteGroup(group.id)}
                  className="shrink-0 h-7 w-7 flex items-center justify-center rounded-full hover:bg-red-50 text-ink-muted hover:text-red-600 transition-colors"
                  aria-label="Delete group"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center h-7 px-3 rounded-full bg-surface-alt text-ink text-[12px] font-semibold">
                  Class {group.class}
                </span>
                <span className="inline-flex items-center h-7 px-3 rounded-full bg-surface-alt text-ink text-[12px] font-semibold">
                  {group.subject}
                </span>
                <span
                  className={`inline-flex items-center h-7 px-3 rounded-full text-[12px] font-semibold ${
                    EXAM_TYPE_COLORS[group.examType] ?? 'bg-surface-alt text-ink'
                  }`}
                >
                  {group.examType}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CreateGroupModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
