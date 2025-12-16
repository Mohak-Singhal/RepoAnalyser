
# RepoAnalyzer - Get the Real Score of Any GitHub Project

* **📺 Watch Video Demo:** [https://youtu.be/qPmNon0FGA8](https://youtu.be/qPmNon0FGA8)
* **▶️ Use Live App:** [https://repo-analyser-nine.vercel.app](https://repo-analyser-nine.vercel.app)

![RepoAnalyzer](https://github.com/user-attachments/assets/cedf3c20-fcce-4f0b-9a25-be92e62a0119)

**RepoAnalyzer** is a comprehensive GitHub repository analysis tool that performs deep analysis of architecture, functionality, optimization, completeness, and working status. It determines if your project actually works and provides detailed insights into code quality, AI usage, frontend-backend connectivity, and more.

![RepoAnalyzer](https://github.com/user-attachments/assets/5e6a94c8-e429-4d7d-b998-ab6a068de0c4)

![RepoAnalyzer](https://github.com/user-attachments/assets/d25c7ecc-1319-4b42-9359-842c7a4c16b6)
## 🎯 Core Features

- **Comprehensive Repository Analysis**: Automatically analyzes code quality, project structure, documentation, test coverage, commit history, and Git best practices
- **AI-Powered Evaluation**: Uses Google's Gemini AI to provide intelligent, context-aware feedback
- **Detailed Scoring**: Provides scores (0-100) across 6 key dimensions:
  - Code Quality & Readability
  - Project Structure & Organization
  - Documentation Clarity
  - Testing & Reliability
  - Development Consistency (Git practices)
  - Real-World Usability & Depth
- **Personalized Roadmap**: Generates actionable improvement steps tailored to each repository
- **Mentor-Like Feedback**: Constructive, honest feedback that helps developers grow

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- A Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd gitgrade---ai-repo-reviewer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to `http://localhost:3000`

## 📖 How to Use

1. **Enter a GitHub Repository URL**
   - Paste any public GitHub repository URL (e.g., `https://github.com/Mohak-Singhal/RepoAnalyser`)
   - Click "Analyze Repo"

2. **Wait for Analysis**
   - The system fetches repository data from GitHub API
   - Gemini AI analyzes the codebase and generates evaluation

3. **Review Results**
   - **Overall Score**: 0-100 rating with skill level (Beginner/Intermediate/Advanced/Expert)
   - **Executive Summary**: Professional assessment of strengths and weaknesses
   - **Detailed Breakdown**: Scores across 6 evaluation dimensions
   - **Personalized Roadmap**: Actionable steps to improve your repository

## 🔍 What Gets Analyzed

### Repository Data Collected

- **Basic Metadata**: Stars, forks, languages, topics, description
- **File Structure**: Recursive directory structure (up to 3 levels deep)
- **Documentation**: README, LICENSE, CONTRIBUTING, CODE_OF_CONDUCT
- **Testing**: Detection of test files (unit, integration, e2e)
- **CI/CD**: Detection of CI/CD configuration files
- **Git Practices**: Commit history, branch structure, pull requests
- **Code Quality Indicators**: Project organization, naming conventions

### Evaluation Dimensions

1. **Code Quality & Readability**
   - Code organization and structure
   - Naming conventions
   - Separation of concerns
   - Code complexity indicators

2. **Project Structure & Organization**
   - Folder hierarchy
   - Framework conventions
   - Scalability
   - File naming consistency

3. **Documentation Clarity**
   - README completeness
   - Setup instructions
   - Usage examples
   - Contributing guidelines

4. **Testing & Reliability**
   - Test coverage
   - Test organization
   - CI/CD integration

5. **Development Consistency**
   - Commit message quality
   - Branch management
   - Pull request practices
   - Development workflow

6. **Real-World Usability**
   - Project completeness
   - Production-readiness
   - Practical value
   - Professional presentation

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **AI**: Google Gemini 2.5 Flash
- **Build Tool**: Vite
- **Charts**: Recharts
- **Icons**: Lucide React

## 📝 Output Format

Each analysis includes:

- **Score**: 0-100 overall rating
- **Level**: Beginner / Intermediate / Advanced / Expert
- **Summary**: 2-3 paragraph professional assessment
- **Strengths**: 3-5 specific positive aspects
- **Weaknesses**: 3-5 areas for improvement
- **Tech Stack Analysis**: Evaluation of technology choices
- **Detailed Scores**: Breakdown across 6 dimensions
- **Roadmap**: Prioritized, actionable improvement steps

## 🔒 Privacy & Security

- All analysis is performed client-side
- Repository data is fetched directly from GitHub's public API
- No repository code is stored or logged
- API keys are kept in environment variables (never committed)

## 🐛 Troubleshooting

### "Gemini API Key is missing"
- Ensure you've created a `.env.local` file with `GEMINI_API_KEY=your_key`
- Restart the development server after adding the key

### "Repository not found"
- Verify the repository is public
- Check the URL format: `https://github.com/owner/repo`

### "GitHub API rate limit exceeded"
- GitHub API has rate limits for unauthenticated requests
- Wait a few minutes and try again
- Consider using a GitHub Personal Access Token (future feature)

## 🚧 Future Enhancements

- [ ] Support for private repositories (with authentication)
- [ ] Historical analysis tracking
- [ ] Comparison between repositories
- [ ] Export reports as PDF
- [ ] Integration with GitHub Actions
- [ ] Custom evaluation criteria

