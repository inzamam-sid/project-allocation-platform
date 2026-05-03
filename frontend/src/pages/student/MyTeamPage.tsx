// frontend/src/pages/student/MyTeamPage.tsx
import React, { useState, useEffect } from 'react';
import { teamService } from '@/services/teamService';
import { poolService } from '@/services/poolService';
import { userService } from '@/services/userService';
import { Badge } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Plus, UserPlus, LogOut, Trash2, Mail, CheckCircle2, XCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';
import type { Team, TeamInvite, User, TeamMember } from '@/types';
import { getErrorMessage } from '@/types';

const MyTeamPage: React.FC = () => {
  const { user } = useAuthStore();
  const [poolId, setPoolId] = useState('');
  const [team, setTeam] = useState<Team | null>(null);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [students, setStudents] = useState<User[]>([]);
  const [confirm, setConfirm] = useState<{ action: string; id: string; msg: string } | null>(null);

  useEffect(() => {
    poolService.list().then(async r => {
      const pool = r.data?.[0];
      if (pool) {
        setPoolId(pool.id);
        await load(pool.id);
      }
    }).finally(() => setLoading(false));
  }, []);

  const load = async (pid: string) => {
    const [t, inv] = await Promise.all([teamService.getMyTeam(pid), teamService.getMyInvites(pid)]);
    setTeam(t); setInvites(inv || []);
  };

  const createTeam = async () => {
    if (!teamName.trim()) return;
    try { await teamService.create(poolId, teamName); toast.success('Team created!'); setShowCreate(false); setTeamName(''); load(poolId); }
    catch (e: unknown) { toast.error(getErrorMessage(e)); }
  };

  const loadStudents = async () => {
    const res = await userService.list({ role: 'STUDENT', isActive: 'true', limit: '200' });
    setStudents(res.data || []); setShowInvite(true);
  };

  const sendInvite = async (studentId: string) => {
    if (!team) return;
    try { await teamService.invite(poolId, team.id, studentId); toast.success('Invite sent!'); load(poolId); setShowInvite(false); }
    catch (e: unknown) { toast.error(getErrorMessage(e)); }
  };

  const respondInvite = async (inviteId: string, accept: boolean) => {
    try { await teamService.respond(poolId, inviteId, accept); toast.success(accept ? 'Joined team!' : 'Declined'); load(poolId); }
    catch (e: unknown) { toast.error(getErrorMessage(e)); }
  };

  const doConfirm = async () => {
    if (!confirm || !team) return;
    try {
      if (confirm.action === 'leave') await teamService.leave(poolId, team.id);
      else if (confirm.action === 'remove') await teamService.removeMember(poolId, team.id, confirm.id);
      else if (confirm.action === 'dissolve') await teamService.dissolve(poolId, team.id);
      toast.success('Done'); load(poolId);
    } catch (e: unknown) { toast.error(getErrorMessage(e)); }
    setConfirm(null);
  };

  if (loading) return <LoadingSpinner />;

  const isLeader = team?.leaderId === user?.id;
  const inviteIds = new Set(team?.invites?.map(i => i.inviteeId));
  const memberIds = new Set(team?.members?.map(m => m.studentId));
  const takenMap = new Map(team?.allMembersInPool?.map((m: any) => [m.studentId, m.teamId]));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Team</h1>

      {/* Pending invites */}
      {invites.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-yellow-800">Pending Invites</h2>
          {invites.map(inv => (
            <div key={inv.id} className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between">
              <div><p className="font-medium">Team: {inv.team?.name}</p><p className="text-sm text-gray-600">From: {inv.invitedBy?.firstName} {inv.invitedBy?.lastName}</p></div>
              <div className="flex gap-2">
                <button onClick={() => respondInvite(inv.id, true)} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"><CheckCircle2 className="w-4 h-4" />Accept</button>
                <button onClick={() => respondInvite(inv.id, false)} className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"><XCircle className="w-4 h-4" />Decline</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!team ? (
        <div className="bg-white rounded-xl border p-8 text-center">
          <p className="text-gray-500 mb-4">You're not in a team yet</p>
          {!showCreate ? (
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mx-auto"><Plus className="w-4 h-4" />Create Team</button>
          ) : (
            <div className="max-w-sm mx-auto space-y-3">
              <input value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="Team name" className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="flex gap-2">
                <button onClick={createTeam} className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">Create</button>
                <button onClick={() => setShowCreate(false)} className="flex-1 py-2 bg-white border rounded-lg hover:bg-gray-50 text-sm">Cancel</button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">{team.name}</h2>
              <div className="flex gap-2 mt-1"><Badge text={team.status} />{team.isFrozen && <Badge text="FROZEN" />}</div>
            </div>
            <div className="flex gap-2">
              {isLeader && !team.isFrozen && <button onClick={loadStudents} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"><UserPlus className="w-4 h-4" />Invite</button>}
              {!isLeader && !team.isFrozen && <button onClick={() => setConfirm({ action: 'leave', id: '', msg: 'Are you sure you want to leave?' })} className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200"><LogOut className="w-4 h-4" />Leave</button>}
              {isLeader && !team.isFrozen && <button onClick={() => setConfirm({ action: 'dissolve', id: '', msg: 'This will remove all members and release the project.' })} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"><Trash2 className="w-4 h-4" />Dissolve</button>}
            </div>
          </div>

          {team.project && <div className="bg-green-50 rounded-lg p-3"><p className="text-sm font-medium text-green-800">Project: {team.project.title}</p><p className="text-xs text-green-600">{team.project.domain}</p></div>}

          <div>
            <h3 className="font-medium text-gray-700 mb-2">Members ({team.members?.filter((m: TeamMember) => m.status === 'ACTIVE').length || 0})</h3>
            <div className="space-y-2">
              {team.members?.filter((m: TeamMember) => m.status === 'ACTIVE').map((m: TeamMember) => (
                <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">{m.student.firstName[0]}</div>
                    <div>
                      <p className="font-medium text-sm">{m.student.firstName} {m.student.lastName}</p>
                      <p className="text-xs text-gray-500">{m.student.enrollmentNo} • {m.student.email}</p>
                    </div>
                    {m.role === 'LEADER' && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Leader</span>}
                  </div>
                  {isLeader && m.studentId !== user?.id && !team.isFrozen && (
                    <button onClick={() => setConfirm({ action: 'remove', id: m.studentId, msg: `Remove ${m.student.firstName}?` })} className="p-1 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4 text-red-400" /></button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Invite Student</h3>
            <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="Search by name or enrollment"
              className="w-full px-3 py-2 border rounded-lg text-sm mb-3 outline-none focus:ring-2 focus:ring-blue-500" />
            {/* <div className="space-y-2 max-h-60 overflow-y-auto">
              {students.filter(s =>
                (!inviteEmail || s.firstName.toLowerCase().includes(inviteEmail.toLowerCase()) || s.enrollmentNo?.includes(inviteEmail)) &&
                s.id !== user?.id &&
                !team?.members?.some((m: TeamMember) => m.studentId === s.id && m.status === 'ACTIVE')
              ).map(s => (
                <div key={s.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                  <div><p className="text-sm font-medium">{s.firstName} {s.lastName}</p><p className="text-xs text-gray-500">{s.enrollmentNo}</p></div>
                  <button onClick={() => sendInvite(s.id)} className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">Invite</button>
                </div>
              ))}

            </div> */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {students
                .filter(s =>
                  (!inviteEmail || s.firstName.toLowerCase().includes(inviteEmail.toLowerCase()) || s.enrollmentNo?.includes(inviteEmail)) &&
                  s.id !== user?.id
                )
                .map(s => {

                  let status = 'AVAILABLE';

                  if (memberIds.has(s.id)) {
                    status = 'ACCEPTED';
                  } else if (inviteIds.has(s.id)) {
                    status = 'INVITED';
                  } else if (takenMap.has(s.id) && takenMap.get(s.id) !== team?.id) {
                    status = 'TAKEN';
                  }

                  return (
                    <div key={s.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                      <div>
                        <p className="text-sm font-medium">{s.firstName} {s.lastName}</p>
                        <p className="text-xs text-gray-500">{s.enrollmentNo}</p>
                      </div>

                      {status === 'AVAILABLE' && (
                        <button onClick={() => sendInvite(s.id)} className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
                          Invite
                        </button>
                      )}

                      {status === 'INVITED' && (
                        <button disabled className="px-3 py-1 bg-yellow-500 text-white text-xs rounded">
                          Pending
                        </button>
                      )}

                      {status === 'ACCEPTED' && (
                        <button disabled className="px-3 py-1 bg-green-600 text-white text-xs rounded">
                          Accepted
                        </button>
                      )}

                      {status === 'TAKEN' && (
                        <button disabled className="px-3 py-1 bg-gray-400 text-white text-xs rounded">
                          Taken
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
            <button onClick={() => setShowInvite(false)} className="w-full mt-4 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">Close</button>
          </div>
        </div>
      )}

      {confirm && <ConfirmDialog open title="Confirm" message={confirm.msg} onConfirm={doConfirm} onCancel={() => setConfirm(null)} />}
    </div>
  );
};

export default MyTeamPage;