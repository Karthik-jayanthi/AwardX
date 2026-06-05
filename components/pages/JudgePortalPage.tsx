import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  Award,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Gavel,
  LinkIcon,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Users,
  Layers,
} from 'lucide-react';
import { JudgeScoringModal } from '../dashboard/JudgeScoringModal';
import { Submission, JudgingCriterion } from '../../services/models';

interface JudgeInfo {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
}

interface ProgramInfo {
  id: string;
  title: string;
  description?: string;
  coverImageUrl?: string;
  status: string;
  deadline?: string;
  timezone?: string;
  industryCategory?: string;
}

interface AssignmentInfo {
  submissionJudgeId: string;
  status: string;
  completedAt?: string;
  round?: { id: string; name: string; type: string; status: string } | null;
  submission: Submission | null;
}

export const JudgePortalPage: React.FC = () => {
  const navigate = useNavigate();
  const { token: tokenParam } = useParams<{ token?: string }>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [judge, setJudge] = useState<JudgeInfo | null>(null);
  const [program, setProgram] = useState<ProgramInfo | null>(null);
  const [assignments, setAssignments] = useState<AssignmentInfo[]>([]);
  const [criteria, setCriteria] = useState<JudgingCriterion[]>([]);
  const [organization, setOrganization] = useState('');
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [selectedSubmissionJudgeId, setSelectedSubmissionJudgeId] = useState<string | undefined>();
  const [scoringOpen, setScoringOpen] = useState(false);
  // Task 15: track deleted submissions count for banner
  const [deletedCount, setDeletedCount] = useState(0);
  // Resolved token stored so fetchAssignments can use it without re-verifying
  const [resolvedToken, setResolvedToken] = useState<string | null>(null);

  // Task 14: separate function that only re-fetches assignments/criteria (no token re-verify)
  const fetchAssignments = useMemo(() => async (token: string) => {
    const resp = await fetch(`/api/invites/verify-judge?token=${encodeURIComponent(token)}`);
    const data = await resp.json();
    if (!resp.ok) return;
    const allAssignments: AssignmentInfo[] = data.assignments || [];
    const valid = allAssignments.filter((item) => item.submission);
    const removed = allAssignments.length - valid.length;
    setDeletedCount(removed);
    setAssignments(valid);
    setCriteria(data.criteria || []);
  }, []);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const token = tokenParam || params.get('token');

        if (!token) {
          setStatus('error');
          setErrorMessage('No invite token found. Please check your email link.');
          return;
        }

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(token)) {
          setStatus('error');
          setErrorMessage('Invalid invite link format.');
          return;
        }

        const resp = await fetch(`/api/invites/verify-judge?token=${encodeURIComponent(token)}`);
        const data = await resp.json();

        if (!resp.ok) {
          setStatus('error');
          setErrorMessage(data.error || 'Failed to verify invite.');
          return;
        }

        setJudge(data.judge);
        setProgram(data.program);
        const allAssignments: AssignmentInfo[] = data.assignments || [];
        const valid = allAssignments.filter((item: AssignmentInfo) => item.submission);
        // Task 15: track silently-filtered (deleted) submissions
        setDeletedCount(allAssignments.length - valid.length);
        setAssignments(valid);
        setCriteria(data.criteria || []);
        setOrganization(data.organization || '');
        setResolvedToken(token);
        setStatus('success');
      } catch (err: any) {
        console.error('Judge portal error:', err);
        setStatus('error');
        setErrorMessage('Something went wrong. Please try again or contact the organizer.');
      }
    };

    verifyToken();
  }, [tokenParam]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const stats = useMemo(() => {
    const total = assignments.length;
    const completed = assignments.filter((assignment) => assignment.status === 'completed').length;
    const pending = total - completed;
    return { total, completed, pending };
  }, [assignments]);

  const openScoring = (assignment: AssignmentInfo) => {
    if (!assignment.submission) return;
    setSelectedSubmission(assignment.submission);
    setSelectedSubmissionJudgeId(assignment.submissionJudgeId);
    setScoringOpen(true);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#f8faf9] flex items-center justify-center font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 mb-2">Verifying your invite…</h2>
          <p className="text-slate-500">Please wait while we set up your judging portal.</p>
        </motion.div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-[#f8faf9] flex items-center justify-center p-4 font-sans">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 md:p-12 max-w-md w-full text-center"
        >
          <div className="w-14 h-14 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-7 h-7 text-rose-600" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 mb-3">Unable to open judging portal</h2>
          <p className="text-slate-500 mb-6">{errorMessage}</p>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors font-semibold text-sm"
          >
            Go to Homepage
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8faf9] font-sans text-slate-900">
      <JudgeScoringModal
        isOpen={scoringOpen}
        onClose={() => {
          setScoringOpen(false);
          setSelectedSubmission(null);
          setSelectedSubmissionJudgeId(undefined);
        }}
        submission={selectedSubmission}
        criteria={criteria}
        submissionJudgeId={selectedSubmissionJudgeId}
        isJudgeView={true}
        judgeToken={resolvedToken || undefined}
        onScored={() => {
          setAssignments((prev) =>
            prev.map((assignment) =>
              assignment.submissionJudgeId === selectedSubmissionJudgeId
                ? { ...assignment, status: 'completed', completedAt: new Date().toISOString() }
                : assignment,
            ),
          );
          if (resolvedToken) fetchAssignments(resolvedToken);
        }}
      />

      <header className="bg-white/95 backdrop-blur border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center shadow-sm shadow-emerald-200/60">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-display text-xl font-semibold text-slate-900">AwardX</span>
              <p className="text-[11px] text-slate-500 -mt-0.5">
                {organization ? `${organization} · Judging Portal` : 'Judging Portal'}
              </p>
            </div>
          </div>
          {judge && (
            <div className="flex items-center gap-3">
              <span className="hidden md:inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                <Clock className="w-3 h-3" /> {stats.pending} pending
              </span>
              <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
                {judge.avatarUrl ? (
                  <img src={judge.avatarUrl} alt="" className="w-9 h-9 rounded-full border-2 border-white shadow-sm object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full border-2 border-white shadow-sm bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                    {judge.name?.charAt(0).toUpperCase() || 'J'}
                  </div>
                )}
                <div className="hidden md:block text-left">
                  <div className="text-sm font-bold text-slate-900">{judge.name}</div>
                  <div className="text-xs text-slate-500">Judge</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Program header card */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 overflow-hidden rounded-xl border border-slate-200 bg-white"
        >
          {program?.coverImageUrl ? (
            <div className="relative h-44">
              <img
                src={program.coverImageUrl}
                alt={program.title}
                className="h-full w-full object-cover"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-slate-950/10 to-transparent" />
            </div>
          ) : (
            <div className="relative flex h-36 items-center justify-center bg-emerald-50/60 border-b border-emerald-100">
              <Award className="h-14 w-14 text-emerald-600/40" />
            </div>
          )}
          <div className="p-6 md:p-8">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold border border-emerald-200 bg-emerald-50 text-emerald-700">
                {program?.industryCategory || 'Award Program'}
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold border border-slate-200 bg-slate-50 text-slate-600">
                {program?.status || 'Active'}
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold border border-emerald-200 bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {stats.completed}/{stats.total} completed
              </span>
            </div>
            <h2 className="mb-2 text-3xl font-semibold tracking-tight text-slate-900">{program?.title}</h2>
            {program?.description && (
              <p className="mb-4 max-w-3xl text-slate-500">{program.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
              {program?.deadline && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>Deadline: {formatDate(program.deadline)}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-slate-400" />
                <span>{stats.total} assigned submission{stats.total !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-slate-400" />
                <span>{criteria.length} scoring criteria</span>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Stat cards (AwardX style) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Assigned</p>
              <Layers className="w-4 h-4 text-slate-400" />
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Scored</p>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{stats.completed}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Pending</p>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{stats.pending}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Criteria</p>
              <Target className="w-4 h-4 text-slate-400" />
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{criteria.length}</p>
          </div>
        </div>

        {/* Welcome strip */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 rounded-xl border border-emerald-200 bg-white p-5 md:p-6"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 shrink-0">
                <Gavel className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-slate-900">
                  Welcome, {judge?.name}.
                </h3>
                <p className="mt-0.5 max-w-2xl text-sm text-slate-500">
                  Review your assigned submissions, score them against the official criteria, and save your progress as you go.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Criteria */}
        {criteria.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-8 rounded-xl border border-slate-200 bg-white p-6"
          >
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-900">
              <Star className="h-5 w-5 text-emerald-600" /> Scoring Criteria
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {criteria.map((criterion) => (
                <div key={criterion.id} className="rounded-xl border border-slate-200 bg-[#f8faf9] p-4">
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <h4 className="font-semibold text-slate-900">{criterion.name}</h4>
                    <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                      {criterion.weight}%
                    </span>
                  </div>
                  {criterion.description && <p className="text-sm text-slate-500">{criterion.description}</p>}
                  <p className="mt-2 text-xs text-slate-500">Score range: {criterion.minScore} – {criterion.maxScore}</p>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Assignments */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-900">
              <Users className="h-5 w-5 text-emerald-600" /> Assigned Submissions
            </h3>
            <div className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">
              {stats.completed} scored · {stats.pending} remaining
            </div>
          </div>

          {deletedCount > 0 && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {deletedCount} submission{deletedCount > 1 ? 's' : ''} previously assigned to you {deletedCount > 1 ? 'are' : 'is'} no longer available.
            </div>
          )}

          {assignments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50/60 p-10 text-center">
              <div className="w-12 h-12 rounded-xl bg-white text-emerald-700 flex items-center justify-center mx-auto mb-4 border border-emerald-200">
                <FileText className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-semibold text-slate-900 mb-2">No assigned submissions yet</h4>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                The organizer hasn't assigned any entries to your judging panel yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {assignments.map((assignment, idx) => {
                const submission = assignment.submission;
                if (!submission) return null;
                const completed = assignment.status === 'completed';
                return (
                  <motion.article
                    key={assignment.submissionJudgeId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 + idx * 0.04 }}
                    whileHover={{ y: -2 }}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white transition-all hover:border-emerald-300 hover:shadow-sm"
                  >
                    <div className="flex h-full flex-col">
                      <div className="flex items-start justify-between gap-4 p-5">
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                              #{idx + 1}
                            </span>
                            {assignment.round && (
                              <span className="inline-flex items-center rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                                <Layers className="w-3 h-3 mr-1" /> {assignment.round.name}
                              </span>
                            )}
                            <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                              {submission.category}
                            </span>
                            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold border ${
                              completed
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-amber-200 bg-amber-50 text-amber-700'
                            }`}>
                              {completed ? (
                                <><CheckCircle2 className="w-3 h-3 mr-1" /> Scored</>
                              ) : (
                                <><Clock className="w-3 h-3 mr-1" /> Pending</>
                              )}
                            </span>
                          </div>
                          <h4 className="text-lg font-semibold tracking-tight text-slate-900">{submission.title}</h4>
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                            {submission.applicantName && <span>by {submission.applicantName}</span>}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {formatDate(submission.submittedAt)}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setExpandedSubmission(expandedSubmission === submission.id ? null : submission.id)}
                          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
                          aria-label={expandedSubmission === submission.id ? 'Collapse details' : 'Expand details'}
                        >
                          {expandedSubmission === submission.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </button>
                      </div>

                      <div className="px-5 pb-5">
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-1.5 rounded-full ${completed ? 'bg-emerald-500' : 'bg-slate-200'}`}
                            style={{ width: completed ? '100%' : '0%' }}
                          />
                        </div>
                      </div>

                      {expandedSubmission === submission.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          className="border-t border-slate-100 px-5 pb-5"
                        >
                          <div className="space-y-4 pt-4">
                            {submission.coverImageUrl && (
                              <img
                                src={submission.coverImageUrl}
                                alt={submission.title}
                                className="h-56 w-full rounded-xl border border-slate-200 object-cover"
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                              />
                            )}
                            {submission.description && (
                              <div>
                                <h5 className="mb-1 text-sm font-semibold text-slate-700">Description</h5>
                                <p className="text-sm leading-relaxed text-slate-600">{submission.description}</p>
                              </div>
                            )}
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => openScoring(assignment)}
                                className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                              >
                                <Star className="h-4 w-4" /> {completed ? 'Review score' : 'Score entry'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setExpandedSubmission(null)}
                                className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:border-slate-300"
                              >
                                Collapse
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}
        </motion.section>

        <div className="mt-12 pb-8 text-center text-sm text-slate-500">
          Powered by <strong className="font-display text-slate-700">AwardX</strong> · Questions? Contact the program organizer.
        </div>
      </main>
    </div>
  );
};
