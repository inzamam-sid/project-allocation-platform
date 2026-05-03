// frontend/src/types/index.ts
export type UserRole = 'ADMIN' | 'SUBADMIN' | 'FACULTY' | 'STUDENT';
export type PoolStatus = 'DRAFT' | 'SUBMISSION_OPEN' | 'UNDER_REVIEW' | 'DECISION_PENDING' | 'SELECTION_OPEN' | 'TEAMS_FORMING' | 'FROZEN' | 'ARCHIVED';
export type ProjectStatus = 'DRAFT' | 'SUBMITTED' | 'LOCKED' | 'ON_HOLD' | 'APPROVED' | 'REJECTED';
export type TeamStatus = 'FORMING' | 'COMPLETE' | 'FROZEN' | 'DISSOLVED';
export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  enrollmentNo?: string;
  department?: string;
  semester?: number;
  section?: string;
  designation?: string;
  phone?: string;
  isActive: boolean;
  mustResetPwd: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface Pool {
  id: string;
  name: string;
  academicYear: string;
  semester: string;
  department?: string;
  status: PoolStatus;
  submissionStart: string;
  submissionEnd: string;
  reviewStart: string;
  reviewEnd: string;
  decisionDeadline: string;
  selectionStart: string;
  selectionEnd: string;
  teamFreezeDate: string;
  minTeamSize: number;
  defaultMaxTeamSize: number;
  allowStudentIdeas: boolean;
  createdAt: string;
  creator?: { firstName: string; lastName: string };
  subadmins?: { subadmin: User }[];
  faculty?: { faculty: User; hasSubmitted: boolean }[];
  _count?: { faculty: number; students: number; projects: number; teams: number };
}

export interface Project {
  id: string;
  poolId: string;
  facultyId: string;
  title: string;
  description: string;
  domain?: string;
  prerequisites?: string;
  maxTeamSize: number;
  expectedOutcome?: string;
  status: ProjectStatus;
  subadminNote?: string;
  adminNote?: string;
  createdAt: string;
  faculty?: { id: string; firstName: string; lastName: string; email: string };
  reviewedBy?: { firstName: string; lastName: string };
  decidedBy?: { firstName: string; lastName: string };
  team?: Team | null;
}

export interface Team {
  id: string;
  poolId: string;
  projectId?: string;
  name: string;
  leaderId: string;
  status: TeamStatus;
  isFrozen: boolean;
  createdAt: string;
  project?: { id: string; title: string; domain?: string; faculty?: { firstName: string; lastName: string } };
  members?: TeamMember[];
  leader?: { id: string; firstName: string; lastName: string };
  invites?: TeamInvite[];
  _count?: { members: number };
  allMembersInPool?: {
  studentId: string;
  teamId: string;
}[];
}

export interface TeamMember {
  id: string;
  teamId: string;
  studentId: string;
  role: 'LEADER' | 'MEMBER';
  status: 'ACTIVE' | 'LEFT' | 'REMOVED';
  student: { id: string; firstName: string; lastName: string; email: string; enrollmentNo?: string };
}

export interface TeamInvite {
  id: string;
  teamId: string;
  inviteeId: string;
  status: InviteStatus;
  message?: string;
  expiresAt: string;
  team?: { id: string; name: string; leader?: { firstName: string; lastName: string } };
  invitedBy?: { firstName: string; lastName: string };
  invitee?: { id: string; firstName: string; lastName: string; email: string };
}

export interface StudentIdea {
  id: string;
  poolId: string;
  studentId: string;
  title: string;
  description: string;
  domain?: string;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  adminFeedback?: string;
  student?: { firstName: string; lastName: string; enrollmentNo?: string };
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ImportResult {
  jobId: string;
  status: string;
  totalRows: number;
  successCount: number;
  failureCount: number;
  duplicateCount: number;
  results: {
    rowNumber: number;
    status: string;
    name?: string;
    email?: string;
    enrollment?: string;
    role?: string;
    error?: string;
    tempPassword?: string;
  }[];
}

// ── Input Types (for service method parameters) ──

export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  department?: string;
  enrollmentNo?: string;
  semester?: number;
  section?: string;
  designation?: string;
}

export interface CreatePoolInput {
  name: string;
  academicYear: string;
  semester: string;
  department?: string;
  submissionStart: string;
  submissionEnd: string;
  reviewStart: string;
  reviewEnd: string;
  decisionDeadline: string;
  selectionStart: string;
  selectionEnd: string;
  teamFreezeDate: string;
  subadminIds: string[];
  facultyIds: string[];
  studentIds: string[];
  minTeamSize?: number;
  defaultMaxTeamSize?: number;
  allowStudentIdeas?: boolean;
}

export interface AssignUsersInput {
  subadminIds?: string[];
  facultyIds?: string[];
  studentIds?: string[];
}

export interface ProjectInput {
  title: string;
  description: string;
  domain?: string;
  prerequisites?: string;
  expectedOutcome?: string;
  maxTeamSize?: number;
}

export interface ReviewDecision {
  projectId: string;
  action: 'LOCK' | 'HOLD';
  note?: string;
}

export interface IdeaInput {
  title: string;
  description: string;
  domain?: string;
}

// ── Stats & Display Types ──

export interface UserStats {
  total: number;
  students: number;
  faculty: number;
  subadmins: number;
  admins: number;
  active: number;
  inactive: number;
}

export interface PoolStats {
  facultyCount: number;
  studentCount: number;
  projectCount: number;
  approvedCount: number;
  teamCount: number;
}

export interface FacultyStatus {
  facultyId: string;
  hasSubmitted: boolean;
  submittedAt?: string;
  faculty: { id: string; firstName: string; lastName: string; email: string };
}

export interface CreatedUserResult {
  user: User;
  tempPassword: string;
}

// ── Error helper ──

export function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const axiosErr = err as { response?: { data?: { message?: string } } };
    return axiosErr.response?.data?.message || 'Something went wrong';
  }
  return 'Something went wrong';
}