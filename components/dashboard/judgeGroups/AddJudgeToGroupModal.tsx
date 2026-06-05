import React, { useState, useMemo, useEffect } from 'react';
import { Mail, Search, UserCheck, UserPlus } from 'lucide-react';
import { Button } from '../../Button';
import { Modal } from '../../Modal';
import { Judge, JudgeGroup, TeamMember } from '../../../services/models';
import { db } from '../../../services/database';
import { sendJudgeInviteEmail } from '../../../services/email';
import { toast } from 'sonner';

interface AddJudgeToGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetGroup: JudgeGroup | null;
  judgeGroups: JudgeGroup[];
  /** All judges already on this program */
  judges: Judge[];
  /** Org members not yet judges */
  teamMembers: TeamMember[];
  programId: string;
  programTitle: string;
  onDone: () => void;
}

const STATUS_PILL: Record<string, string> = {
  Active:    'bg-green-100 text-green-700',
  Invited:   'bg-amber-100 text-amber-700',
  Completed: 'bg-indigo-100 text-indigo-700',
};

export const AddJudgeToGroupModal: React.FC<AddJudgeToGroupModalProps> = ({
  isOpen,
  onClose,
  targetGroup,
  judgeGroups,
  judges,
  teamMembers,
  programId,
  programTitle,
  onDone,
}) => {
  const [search, setSearch] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteGroupId, setInviteGroupId] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    setInviteGroupId(targetGroup?.id || '');
  }, [targetGroup?.id, isOpen]);

  // Emails of judges already on this program (to exclude from org-member results)
  const judgeEmailSet = useMemo(
    () => new Set(judges.map((j) => j.email.trim().toLowerCase())),
    [judges],
  );

  const groupNameById = useMemo(
    () => new Map(judgeGroups.map((g) => [g.id, g.name])),
    [judgeGroups],
  );

  const q = search.trim().toLowerCase();

  // Case 1 — existing judges that match the search
  const matchingJudges = useMemo(() => {
    if (!q) return [];
    return judges.filter(
      (j) => j.name.toLowerCase().includes(q) || j.email.toLowerCase().includes(q),
    );
  }, [q, judges]);

  // Case 2 — org members not yet judges that match the search
  const matchingMembers = useMemo(() => {
    if (!q) return [];
    return teamMembers.filter(
      (m) =>
        !judgeEmailSet.has(m.email.trim().toLowerCase()) &&
        (m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)),
    );
  }, [q, teamMembers, judgeEmailSet]);

  const hasSearched = search.trim().length > 0;
  const hasAnyResult = matchingJudges.length > 0 || matchingMembers.length > 0;
  const noResults = hasSearched && !hasAnyResult;

  // Pre-fill invite form when nothing is found
  useEffect(() => {
    if (!noResults) return;
    const raw = search.trim();
    if (raw.includes('@')) {
      setInviteEmail(raw);
      setInviteName('');
    } else {
      setInviteName(raw);
      setInviteEmail('');
    }
  }, [noResults, search]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  /** Existing judge → assign to group (no new record needed) */
  const handleAssignToGroup = async (judge: Judge) => {
    const groupId = targetGroup?.id || inviteGroupId;
    if (!groupId) {
      toast.error('Select a group first.');
      return;
    }
    if (judge.groupId === groupId) {
      toast.info(`${judge.name} is already in this group.`);
      return;
    }
    setBusy(judge.id);
    try {
      await db.assignJudgeToGroup(judge.id, groupId);
      toast.success(`${judge.name} assigned to group`);
      onDone();
      handleClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to assign judge to group');
    } finally {
      setBusy(null);
    }
  };

  /** New org member → create judge record + assign to group */
  const handleAddOrgUser = async (member: TeamMember) => {
    setBusy(member.memberId);
    try {
      await db.createJudge({
        name: member.name,
        email: member.email,
        programId,
        groupId: targetGroup?.id || inviteGroupId || undefined,
      });
      toast.success(`${member.name} added to group`);
      onDone();
      handleClose();
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('duplicate key') || msg.includes('already')) {
        toast.error(`${member.email} is already a judge on this program.`);
      } else {
        toast.error(msg || 'Failed to add judge');
      }
    } finally {
      setBusy(null);
    }
  };

  /** Unknown person → invite via email */
  const handleSendInvite = async () => {
    const email = inviteEmail.trim();
    const name  = inviteName.trim();
    if (!email || !name) return;
    setBusy('invite');
    try {
      const judgeData = await db.inviteJudge({
        name,
        email,
        programId,
        groupId: inviteGroupId || targetGroup?.id || undefined,
      });
      const inviteToken = judgeData?.invite_token;
      if (!inviteToken) throw new Error('Unable to generate invite link. Please try again.');
      await sendJudgeInviteEmail({
        email,
        name,
        programTitle,
        organizationId: judgeData?.organization_id,
        programId: judgeData?.program_id || programId,
        inviteId: judgeData?.id,
        inviteUrl: `${window.location.origin}/judge/${inviteToken}`,
      });
      toast.success(`Invite sent to ${email}`);
      onDone();
      handleClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send invite');
    } finally {
      setBusy(null);
    }
  };

  const handleClose = () => {
    setSearch('');
    setInviteEmail('');
    setInviteName('');
    setInviteGroupId(targetGroup?.id || '');
    setBusy(null);
    onClose();
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={targetGroup ? `Add Judge — ${targetGroup.name}` : 'Add Judge'}
    >
      <div className="space-y-5">

        {/* Search input */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Search Judge</label>
          <p className="text-xs text-slate-500 mb-2">Name / Email</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
            />
          </div>
        </div>

        {/* ── Case 1: Existing judges on this program ── */}
        {matchingJudges.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Already a judge on this program
            </p>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5">
              {matchingJudges.map((judge) => {
                const inThisGroup = judge.groupId === targetGroup?.id;
                const currentGroupName = judge.groupId ? groupNameById.get(judge.groupId) : null;
                const isBusy = busy === judge.id;

                return (
                  <div
                    key={judge.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 bg-white"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {judge.avatar ? (
                        <img
                          src={judge.avatar}
                          alt={judge.name}
                          className="w-9 h-9 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                          {judge.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-slate-900 truncate">{judge.name}</div>
                        <div className="text-xs text-slate-500 truncate">{judge.email}</div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_PILL[judge.status] ?? 'bg-slate-100 text-slate-600'}`}>
                            {judge.status}
                          </span>
                          {currentGroupName && (
                            <span className="text-[11px] text-slate-400">
                              {inThisGroup ? 'Already in this group' : `In: ${currentGroupName}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {inThisGroup ? (
                      <span className="shrink-0 text-xs text-slate-400 font-medium">Assigned</span>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="shrink-0 gap-1.5 whitespace-nowrap"
                        disabled={isBusy}
                        onClick={() => handleAssignToGroup(judge)}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        {isBusy ? 'Moving…' : 'Assign to Group'}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Case 2: Org members not yet judges ── */}
        {matchingMembers.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Organization members
            </p>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5">
              {matchingMembers.map((member) => (
                <div
                  key={member.memberId}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-slate-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-slate-900 truncate">{member.name}</div>
                      <div className="text-xs text-slate-500 truncate">{member.email}</div>
                      {member.joinedDate && (
                        <div className="text-[11px] text-slate-400">Member since {member.joinedDate}</div>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="shrink-0 gap-1.5 whitespace-nowrap"
                    disabled={busy === member.memberId}
                    onClick={() => handleAddOrgUser(member)}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    {busy === member.memberId ? 'Adding…' : 'Add To Group'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Case 3: Nothing found → Invite ── */}
        {noResults && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 space-y-4">
            <p className="text-sm text-slate-600">No matching user found.</p>

            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-indigo-500 shrink-0" />
              <span className="font-semibold text-sm text-slate-800">Invite as Judge</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Name</label>
                <input
                  type="text"
                  placeholder="Full name"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="judge@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                />
              </div>
              {judgeGroups.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Assign Group</label>
                  <select
                    value={inviteGroupId}
                    onChange={(e) => setInviteGroupId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                  >
                    <option value="">No group</option>
                    {judgeGroups.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <Button
                className="w-full gap-2"
                disabled={busy === 'invite' || !inviteEmail.trim() || !inviteName.trim()}
                onClick={handleSendInvite}
              >
                <Mail className="w-4 h-4" />
                {busy === 'invite' ? 'Sending…' : 'Send Invite'}
              </Button>
            </div>
          </div>
        )}

        {/* Empty state hint */}
        {!hasSearched && (
          <p className="text-xs text-slate-400 text-center py-1">
            Type a name or email to search judges and organization members
          </p>
        )}

        <div className="pt-2 flex justify-end border-t border-slate-100">
          <Button variant="ghost" onClick={handleClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
};
