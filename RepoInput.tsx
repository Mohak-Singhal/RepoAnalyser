import React, { useState } from 'react';
import { Search, Github, Sparkles, TrendingUp, Target, Loader2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface RepoInputProps {
  onAnalyze: (url: string) => void;
  isLoading: boolean;
}

const RepoInput: React.FC<RepoInputProps> = ({ onAnalyze, isLoading }) => {
  const { theme } = useTheme();
  const [url, setUrl] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onAnalyze(url);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto text-center space-y-12 animate-fade-in-up">
      {/* Hero Section */}
      <div className="space-y-6">
        <div className="inline-flex items-center justify-center p-4 glass-effect rounded-2xl mb-6 border animate-float" style={{ borderColor: 'var(--border-color)' }}>
          <Github className="w-16 h-16" style={{ color: 'var(--accent)' }} />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
            <span className="gradient-text">RepoAnalyzer</span>
          </h1>
          <p className="text-xl md:text-2xl max-w-2xl mx-auto font-medium" style={{ color: 'var(--text-primary)' }}>
            Comprehensive Repository Analysis
          </p>
          <p className="text-lg max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Professional analysis of code quality, functionality, and architecture. Get detailed, structured feedback with actionable insights.
          </p>
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="relative group">
        <div className={`relative flex items-center glass-effect rounded-2xl p-2 transition-all duration-300 border ${isFocused ? 'shadow-lg' : ''}`}
             style={{ 
               borderColor: isFocused ? 'var(--accent)' : 'var(--border-color)',
               boxShadow: isFocused ? '0 0 0 3px rgba(37, 99, 235, 0.1)' : 'none'
             }}>
          <div className="pl-4 pr-2">
            <Search className="w-6 h-6" style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="https://github.com/username/repository"
            className="flex-1 bg-transparent border-none outline-none px-4 py-5 text-lg font-medium"
            style={{ color: 'var(--text-primary)' }}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className={`px-8 py-5 rounded-xl font-semibold transition-all duration-300 mr-2 text-white ${
              isLoading || !url.trim()
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:scale-105 active:scale-95'
            }`}
            style={{ 
              backgroundColor: isLoading || !url.trim() ? 'var(--border-color)' : 'var(--accent)'
            }}
            onMouseEnter={(e) => {
              if (!isLoading && url.trim()) {
                e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading && url.trim()) {
                e.currentTarget.style.backgroundColor = 'var(--accent)';
              }
            }}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Analyze <Sparkles className="w-4 h-4" />
              </span>
            )}
          </button>
        </div>
      </form>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
        <div className="glass-effect rounded-xl p-6 hover-lift border animate-slide-in-right" style={{ borderColor: 'var(--border-color)' }}>
          <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 mx-auto border glass-effect" style={{ borderColor: 'var(--border-color)' }}>
            <Target className="w-6 h-6" style={{ color: 'var(--accent)' }} />
          </div>
          <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Code Quality</h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Professional assessment of code readability and maintainability</p>
        </div>
        
        <div className="glass-effect rounded-xl p-6 hover-lift border animate-fade-in-up" style={{ animationDelay: '0.1s', borderColor: 'var(--border-color)' }}>
          <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 mx-auto border glass-effect" style={{ borderColor: 'var(--border-color)' }}>
            <TrendingUp className="w-6 h-6" style={{ color: 'var(--accent)' }} />
          </div>
          <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Structured Analysis</h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Detailed breakdown with clear points and explanations</p>
        </div>
        
        <div className="glass-effect rounded-xl p-6 hover-lift border animate-slide-in-left" style={{ borderColor: 'var(--border-color)' }}>
          <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 mx-auto border glass-effect" style={{ borderColor: 'var(--border-color)' }}>
            <Sparkles className="w-6 h-6" style={{ color: 'var(--accent)' }} />
          </div>
          <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Industry-Ready</h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Assess if the solution meets professional standards</p>
        </div>
      </div>

      {/* Trust Badge */}
      <div className="flex justify-center items-center gap-6 text-sm pt-4" style={{ color: 'var(--text-tertiary)' }}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          <span>AI-Powered Analysis</span>
        </div>
        <span>•</span>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          <span>Honest Feedback</span>
        </div>
        <span>•</span>
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          <span>Actionable Roadmap</span>
        </div>
      </div>
    </div>
  );
};

export default RepoInput;