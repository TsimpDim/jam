export interface Group {
  id: number;
  name: string;
  description?: string;
  position?: number;
}

export interface Step {
  id: number;
  name: string;
  notes?: string;
  type: string;
  color?: string;
}

export interface TimelineEntry {
  id: number;
  step: number;
  notes?: string;
  date?: string;
  jobapp: number;
  group: number;
  completed?: boolean;
}

export interface CV {
  id: number;
  key: string;
  file: string;
  created_at: string;
  updated_at: string;
}

export interface JobApplication {
  id: number;
  company: string;
  role: string;
  location?: string;
  applied_through?: string;
  external_link?: string;
  notes?: string;
  date?: string;
  group: number;
  group_name?: string;
  initial_step?: number;
  lead?: number | null;
  cv_used?: CV | null;
  completed?: boolean;
}

export interface Lead {
  id: number;
  company: string;
  role: string;
  location?: string;
  external_link?: string;
  notes?: string;
  group?: number | null;
  archived?: boolean;
  date?: string;
  applications?: JobApplication[];
  generated?: boolean;
}

export interface JobAdSnapshot {
  id: number;
  content?: string;
  url?: string;
  date_captured?: string;
}

export interface LeadSnapshot {
  id: number;
  lead: number;
  text: string;
  fetched_at: string;
}

export interface SourceEffectiveness {
  total: number;
  completed: number;
  conversion_rate: string;
}

export interface TimeTrendEntry {
  period: string;
  count: number;
}

export interface TimeTrends {
  weekly: TimeTrendEntry[];
  monthly: TimeTrendEntry[];
}

export interface StageDurationEntry {
  avg_days: string;
  color: string;
}

export interface CVMetrics {
  total: number;
  completed: number;
}

export interface Analytics {
  totalJobApps: number;
  completedJobApps: number;
  pendingJobApps: number;
  stepsPerApp: string;
  avgDaysBetweenSteps: string;
  avgDaysToCompletion: string;
  appliedThrough: Record<string, number>;
  sourceEffectiveness: Record<string, SourceEffectiveness>;
  totalLeads: number;
  stageDuration: Record<string, StageDurationEntry>;
  timeTrends: TimeTrends;
  cvUsed: Record<string, number>;
  cvAvgSteps: Record<string, string>;
}

export interface SankeyNodeData {
  name: string;
  color: string;
}

export interface SankeyLinkData {
  source: number;
  target: number;
  value: number;
}

export interface SankeyData {
  nodes: SankeyNodeData[];
  links: SankeyLinkData[];
}

export interface GroupReorderPayload {
  id: number;
  position: number;
}

export interface UserInfo {
  pk: number;
  username: string;
  is_premium: boolean;
  cv_limit: number;
  cv_count: number;
}

export interface Industry {
  id: number;
  name: string;
  slug: string;
}

export interface ExperienceLevel {
  id: number;
  name: string;
  slug: string;
}

export interface Role {
  id: number;
  name: string;
  slug: string;
}

export interface CVReview {
  id: number;
  cv: number;
  cv_key: string;
  cv_file: string;
  industry: number;
  industry_name: string;
  experience_level: number;
  experience_level_name: string;
  roles: number[];
  roles_names: string[];
  review_result: string | null;
  is_done: boolean;
  created_at: string;
  completed_at: string | null;
}

export interface City {
  id: number;
  name: string;
  slug: string;
  country: number | null;
  country_name: string | null;
}

export interface Country {
  id: number;
  name: string;
  slug: string;
  code: string;
}

export interface LeadGenerationRequest {
  id: number;
  countries: number[];
  countries_names: string[];
  cities: number[];
  cities_names: string[];
  company_leads_only: boolean;
  roles: number[];
  roles_names: string[];
  modes: string[];
  experience_level: number[];
  experience_level_names: string[];
  industries: number[];
  industries_names: string[];
  company_sizes: string[];
  result: string | null;
  is_done: boolean;
  created_at: string;
  completed_at: string | null;
}

export interface CoverLetterGenerationRequest {
  id: number;
  cv: number;
  cv_key: string;
  lead: number;
  lead_company: string;
  lead_role: string;
  result: string | null;
  is_done: boolean;
  created_at: string;
  completed_at: string | null;
}

export interface AppNotification {
  id: number;
  notification_type: string;
  status: 'success' | 'error' | 'info' | 'warning';
  text: string;
  is_read: boolean;
  created_at: string;
}

export interface UnreadCountResponse {
  count: number;
}
