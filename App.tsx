import React, { useState } from 'react';
import RepoInput from './components/RepoInput';
import AnalysisDashboard from './components/AnalysisDashboard';
import { RepoMetadata, AnalysisResult, AnalysisStatus } from './types';
import { fetchRepoData, parseGithubUrl } from './services/githubService';
import { analyzeRepository } from './services/geminiService';
import { Loader2, AlertTriangle, Sparkles, Activity, Moon, Sun } from 'lucide-react';
import { useTheme } from './contexts/ThemeContext';

const App: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [repoData, setRepoData] = useState<RepoMetadata | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (url: string) => {
    setError(null);
    setStatus(AnalysisStatus.FETCHING_GITHUB);

    const repoInfo = parseGithubUrl(url);
    
    if (!repoInfo) {
      setError("Invalid GitHub URL. Please use format: https://github.com/owner/repo");
      setStatus(AnalysisStatus.IDLE);
      return;
    }

    try {
      // Step 1: Fetch from GitHub
      const data = await fetchRepoData(repoInfo.owner, repoInfo.repo);
      setRepoData(data);

      // Step 2: Analyze with Gemini
      setStatus(AnalysisStatus.ANALYZING_GEMINI);
      const result = await analyzeRepository(data);
      
      setAnalysis(result);
      setStatus(AnalysisStatus.COMPLETE);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
      setStatus(AnalysisStatus.ERROR);
    }
  };

  const handleReset = () => {
    setStatus(AnalysisStatus.IDLE);
    setRepoData(null);
    setAnalysis(null);
    setError(null);
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Subtle background pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-30" 
           style={{ 
             backgroundImage: 'radial-gradient(circle at 1px 1px, var(--border-color) 1px, transparent 0)',
             backgroundSize: '24px 24px'
           }}></div>

      <header className="relative z-10 p-6 flex justify-between items-center max-w-7xl mx-auto w-full animate-fade-in border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-3 font-bold text-xl tracking-tight">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center animate-scale-in hover-lift glass-effect">
            <Activity className="w-6 h-6" style={{ color: 'var(--accent)' }} />
          </div>
          <span className="gradient-text text-2xl font-extrabold">RepoAnalyzer</span>
        </div>
        <nav className="flex items-center gap-6">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover-lift glass-effect"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
            ) : (
              <Sun className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
            )}
          </button>
        </nav>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[85vh]">
        
        {status === AnalysisStatus.IDLE && (
          <div className="w-full animate-fade-in-up">
            <RepoInput onAnalyze={handleAnalyze} isLoading={false} />
          </div>
        )}

        {(status === AnalysisStatus.FETCHING_GITHUB || status === AnalysisStatus.ANALYZING_GEMINI) && (
          <div className="flex flex-col items-center space-y-8 animate-scale-in">
            <div className="relative">
              <div className="relative glass-effect rounded-full p-8 border" style={{ borderColor: 'var(--border-color)' }}>
                <Loader2 className="w-20 h-20 animate-spin" style={{ color: 'var(--accent)' }} />
              </div>
            </div>
            <div className="text-center space-y-4 animate-slide-down">
              <div className="flex items-center justify-center gap-3">
                <Sparkles className="w-6 h-6 animate-bounce-slow" style={{ color: 'var(--accent)' }} />
                <h2 className="text-4xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
                  {status === AnalysisStatus.FETCHING_GITHUB ? 'Analyzing Repository...' : 'Analyzing Codebase...'}
                </h2>
                <Sparkles className="w-6 h-6 animate-bounce-slow" style={{ color: 'var(--accent)', animationDelay: '0.5s' }} />
              </div>
              <p className="text-xl max-w-lg font-medium" style={{ color: 'var(--text-secondary)' }}>
                {status === AnalysisStatus.FETCHING_GITHUB 
                  ? 'Reading repository files and code content...' 
                  : 'Analyzing actual code implementation, quality, and architecture...'}
              </p>
              <div className="flex items-center justify-center gap-3 pt-6">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent)' }}></div>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent)', animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent)', animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}

        {status === AnalysisStatus.ERROR && (
           <div className="text-center space-y-6 max-w-lg animate-scale-in">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full glass-effect mb-4 animate-pulse border" style={{ borderColor: 'var(--error)' }}>
                <AlertTriangle className="w-10 h-10" style={{ color: 'var(--error)' }} />
              </div>
              <h2 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Analysis Failed</h2>
              <div className="glass-effect border-l-4 p-6 text-left rounded-r-lg" style={{ borderLeftColor: 'var(--error)' }}>
                <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
              </div>
              <button 
                onClick={handleReset}
                className="px-8 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105 text-white"
                style={{ backgroundColor: 'var(--accent)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent)'}
              >
                Try Again
              </button>
           </div>
        )}

        {status === AnalysisStatus.COMPLETE && repoData && analysis && (
          <div className="w-full animate-fade-in">
            <AnalysisDashboard 
              repoData={repoData} 
              analysis={analysis} 
              onReset={handleReset} 
            />
          </div>
        )}
      </main>
      
      <footer className="relative z-10 py-8 text-center text-sm border-t mt-auto animate-fade-in" style={{ borderColor: 'var(--border-color)', color: 'var(--text-tertiary)' }}>
        <p>
          &copy; {new Date().getFullYear()} RepoAnalyzer. AI-Powered Repository Analysis.
        </p>
      </footer>
    </div>
  );
};

export default App;