export type Temperature = "cold" | "warm" | "hot";

export type ClientStatus = "prospect" | "proposal_sent" | "active_client" | "churned";

export type ActivityType = "call" | "email" | "meeting" | "note" | "follow_up";

export type LeadSource =
  | "website"
  | "whatsapp"
  | "referido"
  | "redes_sociales"
  | "llamada_fria"
  | "email"
  | "formulario"
  | "evento"
  | "import"
  | "webhook"
  | "otro";

export interface AccessMapEntry {
  system: string;
  whoHasAccess: string;
  howToRequest: string;
}

export interface InfraData {
  hostingProvider: string | null;
  hostingPlan: string | null;
  domainRegistrar: string | null;
  dnsStatus: string | null;
  techStack: string[];
  accessMap: AccessMapEntry[];
  deploymentPipeline: string | null;
  thirdPartyIntegrations: string[];
}

export interface Ga4SnapshotMetrics {
  sessions: number;
  users: number;
  bounceRate: number;
  topPages: string[];
  trafficSources: string[];
}

export interface GscSnapshotMetrics {
  clicks: number;
  impressions: number;
  ctr: number;
  avgPosition: number;
}

export interface SeoData {
  indexingStatus: string | null;
  sitemapCoverage: { total: number; indexed: number; gaps: string } | null;
  structuredDataCompleteness: string | null;
  ga4Metrics: Ga4SnapshotMetrics | null;
  gscMetrics: GscSnapshotMetrics | null;
  openContentGaps: string[];
}

export type SecuritySeverity = "low" | "medium" | "high";

export interface SecurityGap {
  description: string;
  severity: SecuritySeverity;
  dateFound: string | null;
}

export interface ComplianceStatus {
  privacyPolicyPublished: boolean;
  cookieConsentLive: boolean;
  applicableLaw: string;
}

export interface SecurityData {
  authMethod: string | null;
  adminAllowlist: string[];
  lastSecurityReviewDate: string | null;
  knownGaps: SecurityGap[];
  complianceStatus: ComplianceStatus | null;
  sslExpiry: string | null;
  lastBackupVerified: string | null;
  overallSecurityRating: string | null;
}

export interface DecisionLogEntry {
  date: string;
  decision: string;
  reasoning: string;
}

export interface Upsell {
  description: string;
  pitched: boolean;
}

export interface AccountHealth {
  engagementLevel: string | null;
  churnRisk: string | null;
  currentBlockers: string[];
  identifiedUpsells: Upsell[];
}

export interface InventoryHealth {
  lowStockCount: number;
  outOfStockCount: number;
}

export interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: LeadSource;
  temperature: Temperature;
  score: number;
  notes: string | null;
  mockupUrl: string | null;
  siteUrl: string | null;
  signedDate: Date | null;
  monthlyPayment: number | null;
  clientStatus: ClientStatus;
  nextPaymentDate: Date | null;
  // Post-close account depth — all optional/nullable, parsed from JSON
  infraData: InfraData | null;
  seoData: SeoData | null;
  securityData: SecurityData | null;
  decisionLog: DecisionLogEntry[];
  accountHealth: AccountHealth | null;
  inventoryHealth: InventoryHealth | null;
  salesDataNotes: string | null;
  funnelTracking: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Proposal {
  id: string;
  contactId: string;
  planName: string;
  oneTimeFee: number;
  monthlyFee: number;
  features: string[];
  addOns: string[];
  automations: string[];
  deliverables: string[];
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Deal {
  id: string;
  title: string;
  value: number; // in cents
  stageId: string;
  contactId: string;
  expectedClose: Date | null;
  probability: number; // 0-100
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  color: string;
  isWon: boolean;
  isLost: boolean;
}

export interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  contactId: string;
  dealId: string | null;
  scheduledAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
}

export interface CrmConfig {
  business: {
    type: string;
    industry: string;
    teamSize: string;
  };
  pipeline: {
    stages: Array<{
      name: string;
      order: number;
      color: string;
      isWon: boolean;
      isLost: boolean;
    }>;
  };
  leadSources: string[];
  preferences: {
    language: "es" | "en";
    theme: "light" | "dark" | "auto";
  };
}

// API response types
export interface DealWithContact extends Deal {
  contact?: Contact;
  stage?: PipelineStage;
  contactName?: string | null;
  contactTemperature?: string | null;
}

export interface ContactWithDeals extends Contact {
  deals?: Deal[];
  activities?: Activity[];
}

export interface PipelineColumn extends PipelineStage {
  deals: DealWithContact[];
}

export interface DashboardStats {
  totalContacts: number;
  activeDeals: number;
  totalPipelineValue: number;
  wonDealsValue: number;
  conversionRate: number;
  hotLeads: number;
  overdueFollowups?: number;
}
