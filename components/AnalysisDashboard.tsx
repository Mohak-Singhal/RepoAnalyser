import React from 'react';
import { RepoMetadata, AnalysisResult, RoadmapStep } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Trophy, 
  Target, 
  GitBranch, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp,
  Code2,
  FileText,
  TestTube,
  GitCommit,
  RefreshCw,
  Star,
  GitFork,
  ExternalLink,
  Sparkles,
  Activity,
  Zap,
  Layers,
  Link2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Brain,
  Gauge
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface AnalysisDashboardProps {
  repoData: RepoMetadata;
  analysis: AnalysisResult;
  onReset: () => void;
}

const ScoreGauge = ({ score }: { score: number }) => {
  const { theme } = useTheme();
  const data = [
    { name: 'Score', value: score },
    { name: 'Remaining', value: 100 - score }
  ];
  
  // Simplified color scheme
  let color = '#dc2626'; // error
  if (score >= 50) color = '#ca8a04'; // warning
  if (score >= 70) color = '#16a34a'; // success
  if (score >= 90) color = '#15803d'; // dark success

  const bgColor = theme === 'dark' ? 'rgba(64, 64, 64, 0.3)' : 'rgba(240, 240, 240, 0.5)';

  return (
    <div className="relative h-64 w-full flex flex-col items-center justify-center animate-scale-in">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={75}
            outerRadius={95}
            startAngle={180}
            endAngle={0}
            paddingAngle={0}
            dataKey="value"
            stroke="none"
          >
            <Cell fill={color} />
            <Cell fill={bgColor} />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
        <span className="text-7xl font-extrabold block" style={{ color: 'var(--text-primary)' }}>{score}</span>
        <span className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>/ 100</span>
      </div>
    </div>
  );
};

const PriorityBadge = ({ priority }: { priority: string }) => {
  const { theme } = useTheme();
  const colors = {
    High: { bg: theme === 'dark' ? 'rgba(220, 38, 38, 0.2)' : 'rgba(220, 38, 38, 0.1)', text: '#dc2626', border: 'rgba(220, 38, 38, 0.3)' },
    Medium: { bg: theme === 'dark' ? 'rgba(202, 138, 4, 0.2)' : 'rgba(202, 138, 4, 0.1)', text: '#ca8a04', border: 'rgba(202, 138, 4, 0.3)' },
    Low: { bg: theme === 'dark' ? 'rgba(22, 163, 74, 0.2)' : 'rgba(22, 163, 74, 0.1)', text: '#16a34a', border: 'rgba(22, 163, 74, 0.3)' },
  };
  const color = colors[priority as keyof typeof colors];
  return (
    <span className="px-3 py-1 rounded-lg text-xs font-semibold border" 
          style={{ backgroundColor: color.bg, color: color.text, borderColor: color.border }}>
      {priority}
    </span>
  );
};

const StatCard = ({ icon: Icon, label, value }: { 
  icon: any; 
  label: string; 
  value: string | number; 
}) => {
  return (
    <div className="glass-effect rounded-xl p-4 border hover-lift animate-scale-in" style={{ borderColor: 'var(--border-color)' }}>
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-5 h-5" style={{ color: 'var(--accent)' }} />
        <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</span>
      </div>
      <div className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{label}</div>
    </div>
  );
};

interface ScoreCardProps {
  label: string;
  score: number;
  icon: any;
  explanation?: string;
  points?: string[];
  onClick?: () => void;
}

const ScoreCard = ({ label, score, icon: Icon, explanation, points, onClick }: ScoreCardProps) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  let barColor = '#dc2626';
  let textColor = '#dc2626';
  if (score >= 50) { barColor = '#ca8a04'; textColor = '#ca8a04'; }
  if (score >= 70) { barColor = '#16a34a'; textColor = '#16a34a'; }
  
  const handleClick = () => {
    if (explanation || points) {
      setIsExpanded(!isExpanded);
      if (onClick) onClick();
    }
  };
  
  return (
    <div 
      className={`glass-effect rounded-xl p-5 border hover-lift animate-slide-in-right transition-all duration-300 ${(explanation || points) ? 'cursor-pointer' : ''}`}
      style={{ borderColor: 'var(--border-color)' }}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
          <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{label}</span>
          {(explanation || points) && (
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Click for details</span>
          )}
        </div>
        <span className="text-2xl font-bold" style={{ color: textColor }}>{score}</span>
      </div>
      <div className="w-full rounded-full h-2.5 overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${score}%`, backgroundColor: barColor }}
        />
      </div>
      {isExpanded && (explanation || points) && (
        <div className="mt-4 pt-4 border-t animate-fade-in" style={{ borderColor: 'var(--border-color)' }}>
          {explanation && (
            <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>{explanation}</p>
          )}
          {points && points.length > 0 && (
            <ul className="space-y-2">
              {points.map((point, idx) => (
                <li key={idx} className="text-sm flex items-start gap-2" style={{ color: 'var(--text-secondary)' }}>
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: textColor }}></span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

const WorkingStatusBadge = ({ status }: { status: string }) => {
  const { theme } = useTheme();
  const statusConfig = {
    'Fully Functional': { bg: theme === 'dark' ? 'rgba(22, 163, 74, 0.2)' : 'rgba(22, 163, 74, 0.1)', text: '#16a34a', border: 'rgba(22, 163, 74, 0.3)', icon: CheckCircle },
    'Partially Working': { bg: theme === 'dark' ? 'rgba(202, 138, 4, 0.2)' : 'rgba(202, 138, 4, 0.1)', text: '#ca8a04', border: 'rgba(202, 138, 4, 0.3)', icon: AlertTriangle },
    'Not Working': { bg: theme === 'dark' ? 'rgba(220, 38, 38, 0.2)' : 'rgba(220, 38, 38, 0.1)', text: '#dc2626', border: 'rgba(220, 38, 38, 0.3)', icon: XCircle },
    'Unknown': { bg: theme === 'dark' ? 'rgba(107, 114, 128, 0.2)' : 'rgba(107, 114, 128, 0.1)', text: '#6b7280', border: 'rgba(107, 114, 128, 0.3)', icon: AlertCircle },
  };
  
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Unknown'];
  const Icon = config.icon;
  
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border animate-scale-in" 
         style={{ backgroundColor: config.bg, color: config.text, borderColor: config.border }}>
      <Icon className="w-5 h-5" />
      <span className="font-semibold">{status}</span>
    </div>
  );
};

const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ repoData, analysis, onReset }) => {
  const { theme } = useTheme();
  
  const getLevelColor = (level: string) => {
    switch(level) {
      case 'Expert': return '#16a34a';
      case 'Advanced': return '#22c55e';
      case 'Intermediate': return '#ca8a04';
      default: return '#6a6a6a';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="glass-effect rounded-2xl p-6 border animate-slide-in-right" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-3xl md:text-4xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
                <span style={{ color: 'var(--accent)' }}>{repoData.owner}</span>
                <span style={{ color: 'var(--text-tertiary)' }}> / </span>
                <span>{repoData.name}</span>
              </h2>
              <a 
                href={`https://github.com/${repoData.owner}/${repoData.name}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-emerald-400 hover:text-emerald-300 transition-colors hover:scale-110 transform duration-200"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>
            <p className="text-lg max-w-3xl" style={{ color: 'var(--text-secondary)' }}>{repoData.description}</p>
            <div className="mt-4 flex items-center gap-4">
              <WorkingStatusBadge status={analysis.workingStatus} />
              <span className="px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: getLevelColor(analysis.level) }}>
                {analysis.level}
              </span>
            </div>
          </div>
          <button 
            onClick={onReset}
            className="px-6 py-3 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 flex items-center gap-2"
            style={{ backgroundColor: 'var(--accent)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent)'}
          >
            <RefreshCw className="w-4 h-4" />
            New Analysis
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Score & Stats */}
        <div className="lg:col-span-1 space-y-6">
          {/* Score Card */}
          <div className="glass-effect rounded-2xl p-6 border animate-scale-in" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center border glass-effect" style={{ borderColor: 'var(--border-color)' }}>
                <Trophy className="w-6 h-6" style={{ color: 'var(--accent)' }} />
              </div>
              <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Overall Score</h3>
            </div>
            <ScoreGauge score={analysis.score} />
          </div>

          {/* Quick Stats */}
          <div className="glass-effect rounded-2xl p-6 border" style={{ borderColor: 'var(--border-color)' }}>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: 'var(--text-tertiary)' }}>
              <Activity className="w-4 h-4" />
              Repository Stats
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={Star} label="Stars" value={repoData.stars} />
              <StatCard icon={GitFork} label="Forks" value={repoData.forks} />
              <StatCard icon={GitCommit} label="Commits" value={repoData.commits.length} />
              <StatCard icon={GitBranch} label="Branches" value={repoData.branches.length} />
              <StatCard icon={TestTube} label="Tests" value={repoData.testFiles.length} />
              <StatCard icon={Code2} label="CI/CD" value={repoData.hasCICD ? 'Yes' : 'No'} />
              <StatCard icon={Code2} label="Code Files Analyzed" value={repoData.filesAnalyzed || repoData.codeFiles?.length || 0} />
              <StatCard icon={FileText} label="Code Size" value={`${((repoData.totalCodeSize || 0) / 1024).toFixed(1)} KB`} />
            </div>
            <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>Primary Language</span>
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                  <span className="font-semibold" style={{ color: 'var(--accent)' }}>{repoData.language}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Comprehensive Analysis */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Executive Summary */}
          <div className="glass-effect rounded-2xl p-6 border animate-slide-in-left" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center border glass-effect" style={{ borderColor: 'var(--border-color)' }}>
                <FileText className="w-5 h-5" style={{ color: 'var(--accent)' }} />
              </div>
              <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Executive Summary</h3>
            </div>
            <p className="leading-relaxed text-lg mb-6" style={{ color: 'var(--text-secondary)' }}>
              {analysis.summary}
            </p>
            <div className="rounded-xl p-5 border glass-effect" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                <h4 className="font-semibold" style={{ color: 'var(--accent)' }}>Tech Stack Analysis</h4>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{analysis.techStackAnalysis}</p>
            </div>
          </div>

          {/* Working Status & AI Usage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-effect rounded-2xl p-6 border animate-slide-in-right" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center border glass-effect" style={{ borderColor: 'var(--border-color)' }}>
                  <Activity className="w-5 h-5" style={{ 
                    color: analysis.workingStatus === 'Fully Functional' ? 'var(--success)' :
                           analysis.workingStatus === 'Partially Working' ? 'var(--warning)' :
                           'var(--error)'
                  }} />
                </div>
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Working Status</h3>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{analysis.workingStatusDetails}</p>
            </div>
            
            <div className="glass-effect rounded-2xl p-6 border animate-slide-in-left" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center border glass-effect" style={{ borderColor: 'var(--border-color)' }}>
                  <Brain className="w-5 h-5" style={{ color: analysis.aiUsageDetected ? 'var(--warning)' : 'var(--text-tertiary)' }} />
                </div>
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>AI Usage</h3>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{analysis.aiUsageDetails}</p>
            </div>
          </div>

          {/* Comprehensive Score Breakdown */}
          <div className="glass-effect rounded-2xl p-6 border animate-fade-in-up" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center border glass-effect" style={{ borderColor: 'var(--border-color)' }}>
                <Gauge className="w-5 h-5" style={{ color: 'var(--accent)' }} />
              </div>
              <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Score Breakdown</h3>
              <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>(Click scores for details)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ScoreCard 
                label="Code Quality" 
                score={analysis.codeQualityScore} 
                icon={Code2}
                explanation={analysis.codeQualityExplanation}
                points={analysis.codeQualityPoints}
              />
              <ScoreCard 
                label="Architecture" 
                score={analysis.architectureScore} 
                icon={Layers}
                explanation={analysis.architectureExplanation}
                points={analysis.architecturePoints}
              />
              <ScoreCard 
                label="Optimization" 
                score={analysis.optimizationScore} 
                icon={Zap}
                explanation={analysis.optimizationExplanation}
                points={analysis.optimizationPoints}
              />
              <ScoreCard 
                label="Functionality" 
                score={analysis.functionalityScore} 
                icon={Activity}
                explanation={analysis.functionalityExplanation}
                points={analysis.functionalityPoints}
              />
              <ScoreCard 
                label="Connectivity" 
                score={analysis.connectivityScore} 
                icon={Link2}
                explanation={analysis.connectivityExplanation}
                points={analysis.connectivityPoints}
              />
              <ScoreCard 
                label="Completeness" 
                score={analysis.completenessScore} 
                icon={CheckCircle}
                explanation={analysis.completenessExplanation}
                points={analysis.completenessPoints}
              />
              <ScoreCard 
                label="Structure" 
                score={analysis.structureScore} 
                icon={Layers}
                explanation={analysis.structureExplanation}
                points={analysis.structurePoints}
              />
              <ScoreCard 
                label="Documentation" 
                score={analysis.documentationScore} 
                icon={FileText}
                explanation={analysis.documentationExplanation}
                points={analysis.documentationPoints}
              />
              <ScoreCard 
                label="Testing" 
                score={analysis.testingScore} 
                icon={TestTube}
                explanation={analysis.testingExplanation}
                points={analysis.testingPoints}
              />
              <ScoreCard 
                label="Git Practices" 
                score={analysis.gitPracticesScore} 
                icon={GitBranch}
                explanation={analysis.gitPracticesExplanation}
                points={analysis.gitPracticesPoints}
              />
            </div>
          </div>


          {/* Main Issues - Prominently Displayed */}
          {analysis.mainIssues && analysis.mainIssues.length > 0 && (
            <div className="glass-effect rounded-2xl p-6 border animate-fade-in-up" style={{ borderColor: 'var(--error)' }}>
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-6 h-6" style={{ color: 'var(--error)' }} />
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Main Issues</h3>
              </div>
              <ul className="space-y-3">
                {analysis.mainIssues.map((issue, i) => (
                  <li key={i} className="flex items-start gap-3 animate-slide-in-right" style={{ animationDelay: `${i * 0.1}s`, color: 'var(--text-secondary)' }}>
                    <span className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ backgroundColor: 'var(--error)' }} />
                    <span className="flex-1 font-medium">{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Next Steps */}
          {analysis.nextSteps && analysis.nextSteps.length > 0 && (
            <div className="glass-effect rounded-2xl p-6 border animate-fade-in-up" style={{ borderColor: 'var(--accent)' }}>
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-6 h-6" style={{ color: 'var(--accent)' }} />
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Next Steps</h3>
              </div>
              <ol className="space-y-3 list-decimal list-inside">
                {analysis.nextSteps.map((step, i) => (
                  <li key={i} className="animate-slide-in-right" style={{ animationDelay: `${i * 0.1}s`, color: 'var(--text-secondary)' }}>
                    <span className="font-medium">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-effect rounded-2xl p-6 border animate-slide-in-right" style={{ borderColor: 'var(--success)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center border glass-effect" style={{ borderColor: 'var(--border-color)' }}>
                  <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--success)' }} />
                </div>
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Strengths</h3>
              </div>
              <ul className="space-y-3">
                {analysis.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-3 animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s`, color: 'var(--text-secondary)' }}>
                    <span className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ backgroundColor: 'var(--success)' }} />
                    <span className="flex-1">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="glass-effect rounded-2xl p-6 border animate-slide-in-left" style={{ borderColor: 'var(--warning)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center border glass-effect" style={{ borderColor: 'var(--border-color)' }}>
                  <AlertCircle className="w-5 h-5" style={{ color: 'var(--warning)' }} />
                </div>
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Areas for Improvement</h3>
              </div>
              <ul className="space-y-3">
                {analysis.weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-3 animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s`, color: 'var(--text-secondary)' }}>
                    <span className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ backgroundColor: 'var(--warning)' }} />
                    <span className="flex-1">{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Detailed Roadmap */}
          <div className="glass-effect rounded-2xl p-6 border animate-fade-in-up" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center border glass-effect" style={{ borderColor: 'var(--border-color)' }}>
                  <TrendingUp className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                </div>
                <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Improvement Roadmap</h3>
              </div>
              <span className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Action Items</span>
            </div>

            <div className="space-y-4">
              {analysis.roadmap.map((step, idx) => (
                <div 
                  key={idx} 
                  className="glass-effect rounded-xl p-5 border transition-all duration-300 hover-lift animate-slide-in-right"
                  style={{ 
                    animationDelay: `${idx * 0.1}s`,
                    borderColor: 'var(--border-color)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-xl border glass-effect flex items-center justify-center font-bold text-lg" style={{ borderColor: 'var(--border-color)', color: 'var(--accent)' }}>
                        {idx + 1}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                        <h4 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>{step.title}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-3 py-1 rounded-lg font-medium border glass-effect" style={{ color: 'var(--text-tertiary)', borderColor: 'var(--border-color)' }}>
                            {step.category}
                          </span>
                          <PriorityBadge priority={step.priority} />
                        </div>
                      </div>
                      <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{step.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisDashboard;
