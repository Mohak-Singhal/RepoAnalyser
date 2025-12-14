export interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

export interface BranchInfo {
  name: string;
  protected: boolean;
}

export interface PullRequestInfo {
  number: number;
  title: string;
  state: string;
  merged: boolean;
  createdAt: string;
}

export interface TestFileInfo {
  path: string;
  type: 'unit' | 'integration' | 'e2e' | 'unknown';
}

export interface RepoMetadata {
  owner: string;
  name: string;
  description: string;
  stars: number;
  forks: number;
  language: string;
  openIssues: number;
  topics: string[];
  readmeContent: string | null;
  fileStructure: string[];
  lastUpdate: string;
  // Enhanced data
  commits: CommitInfo[];
  branches: BranchInfo[];
  pullRequests: PullRequestInfo[];
  testFiles: TestFileInfo[];
  hasCICD: boolean;
  cicdConfigs: string[];
  languages: { [key: string]: number }; // Language breakdown
  totalFiles: number;
  hasLicense: boolean;
  hasContributing: boolean;
  hasCodeOfConduct: boolean;
  defaultBranch: string;
}

export interface RoadmapStep {
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  category: 'Architecture' | 'Code Quality' | 'Documentation' | 'Testing' | 'DevOps' | 'Features' | 'Functionality' | 'Optimization';
}

export interface ScoreExplanation {
  score: number;
  explanation: string;
  points: string[]; // Structured points explaining the score
}

export interface AnalysisResult {
  score: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  summary: string;
  roadmap: RoadmapStep[];
  strengths: string[];
  weaknesses: string[];
  techStackAnalysis: string;
  // Detailed breakdowns with explanations
  codeQualityScore: number;
  codeQualityExplanation: string;
  codeQualityPoints: string[];
  structureScore: number;
  structureExplanation: string;
  structurePoints: string[];
  documentationScore: number;
  documentationExplanation: string;
  documentationPoints: string[];
  testingScore: number;
  testingExplanation: string;
  testingPoints: string[];
  gitPracticesScore: number;
  gitPracticesExplanation: string;
  gitPracticesPoints: string[];
  realWorldRelevanceScore: number;
  realWorldRelevanceExplanation: string;
  realWorldRelevancePoints: string[];
  // Comprehensive analysis
  architectureScore: number;
  architectureExplanation: string;
  architecturePoints: string[];
  optimizationScore: number;
  optimizationExplanation: string;
  optimizationPoints: string[];
  functionalityScore: number;
  functionalityExplanation: string;
  functionalityPoints: string[];
  connectivityScore: number;
  connectivityExplanation: string;
  connectivityPoints: string[];
  completenessScore: number;
  completenessExplanation: string;
  completenessPoints: string[];
  issuesFound: string[];
  mainIssues: string[]; // Top 5-7 main issues (not focused on unit testing)
  nextSteps: string[]; // Clear next steps to fix issues
  aiUsageDetected: boolean;
  aiUsageDetails: string;
  architectureAnalysis: string;
  optimizationAnalysis: string;
  functionalityAnalysis: string;
  connectivityAnalysis: string;
  completenessAnalysis: string;
  workingStatus: 'Fully Functional' | 'Partially Working' | 'Not Working' | 'Unknown';
  workingStatusDetails: string;
}

export enum AnalysisStatus {
  IDLE,
  FETCHING_GITHUB,
  ANALYZING_GEMINI,
  COMPLETE,
  ERROR
}