import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, RepoMetadata } from '../types';

export const analyzeRepository = async (repoData: RepoMetadata): Promise<AnalysisResult> => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API Key is missing. Please set GEMINI_API_KEY environment variable.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Prepare commit messages for analysis
  const commitMessages = repoData.commits.slice(0, 30).map(c => c.message).join('\n');
  const commitQuality = analyzeCommitQuality(repoData.commits);
  
  // Prepare test coverage info
  const testInfo = {
    count: repoData.testFiles.length,
    types: repoData.testFiles.map(t => t.type),
    coverage: repoData.testFiles.length > 0 ? 'Has tests' : 'No tests detected'
  };

  // Prepare structure analysis
  const structureDepth = Math.max(...repoData.fileStructure.map(f => (f.match(/  /g) || []).length));
  const hasProperStructure = structureDepth > 1 && repoData.fileStructure.length > 10;

  // Detect frontend/backend patterns
  const structureStr = repoData.fileStructure.join('\n').toLowerCase();
  const hasFrontend = /(frontend|client|src|public|components|pages|app|ui)/i.test(structureStr) || 
                      /(react|vue|angular|svelte|next|nuxt|gatsby)/i.test(structureStr);
  const hasBackend = /(backend|server|api|routes|controllers|models|services)/i.test(structureStr) ||
                     /(express|fastapi|django|flask|spring|nest)/i.test(structureStr);
  const hasDatabase = /(database|db|models|schema|migrations|prisma|typeorm|sequelize)/i.test(structureStr);

  // Detect AI usage patterns from code and README
  const readmeLower = (repoData.readmeContent || '').toLowerCase();
  const structureLower = structureStr;
  const codeContent = repoData.codeFiles.map(f => f.content).join('\n').toLowerCase();
  const aiIndicators = [
    /openai|anthropic|claude|gpt|gemini|ai model|llm|langchain|llama/i.test(readmeLower + structureLower + codeContent),
    /(ai|artificial intelligence|machine learning|ml|neural)/i.test(readmeLower + codeContent),
    /(prompt|embedding|vector|rag|fine.?tun)/i.test(readmeLower + structureLower + codeContent),
    /(tensorflow|pytorch|keras|transformers|huggingface)/i.test(structureLower + codeContent)
  ];
  const aiUsageDetected = aiIndicators.some(indicator => indicator);

  // Prepare code content for analysis - prioritize high priority files
  const highPriorityFiles = repoData.codeFiles.filter(f => f.priority === 'high').slice(0, 50);
  const mediumPriorityFiles = repoData.codeFiles.filter(f => f.priority === 'medium').slice(0, 30);
  const configFiles = repoData.codeFiles.filter(f => f.isConfig).slice(0, 20);
  const testFiles = repoData.codeFiles.filter(f => f.isTest).slice(0, 20);
  
  // Combine and limit total code size (max ~200KB of code)
  const selectedFiles = [...highPriorityFiles, ...mediumPriorityFiles, ...configFiles, ...testFiles];
  const uniqueFiles = Array.from(new Map(selectedFiles.map(f => [f.path, f])).values());
  
  // Format code files for prompt
  const formatCodeFiles = (files: typeof repoData.codeFiles, maxChars: number = 150000) => {
    let totalChars = 0;
    const formatted: string[] = [];
    
    for (const file of files) {
      if (totalChars >= maxChars) break;
      
      const fileContent = file.content.length > 2000 
        ? file.content.substring(0, 2000) + '\n... [truncated]'
        : file.content;
      
      const fileSection = `
--- FILE: ${file.path} (${file.language || 'Unknown'}, ${file.size} bytes, Priority: ${file.priority}) ---
${fileContent}
`;
      
      if (totalChars + fileSection.length > maxChars) break;
      formatted.push(fileSection);
      totalChars += fileSection.length;
    }
    
    return formatted.join('\n');
  };
  
  const codeContentForAnalysis = formatCodeFiles(uniqueFiles, 150000);

  const prompt = `
You are a Senior Software Engineer with 10+ years of experience reviewing code at top tech companies. Your task is to analyze this GitHub repository by examining the ACTUAL CODE CONTENT, not just file names or README.

CRITICAL: You have access to REAL CODE FILES from this repository. Your analysis MUST be based on:
1. Actual code implementation and quality
2. Code patterns, architecture, and design decisions visible in the code
3. Code organization and structure as seen in the files
4. Real functionality and completeness based on code analysis
5. Code quality, best practices, and maintainability from actual code review

Evaluate this repository from the perspective of:
- Clear thinking and logical problem-solving (visible in code)
- Smart breakdown of complex problems (architecture in code)
- Creativity and engineering judgment (implementation patterns)
- Ability to design solutions that feel industry-ready (code quality)
- Professional code quality and maintainability (actual code review)

=== REPOSITORY INFORMATION ===

Basic Info:
- Repository: ${repoData.owner}/${repoData.name}
- Description: ${repoData.description || "No description provided"}
- Primary Language: ${repoData.language}
- All Languages: ${Object.keys(repoData.languages).join(', ') || 'Unknown'}
- Stars: ${repoData.stars} | Forks: ${repoData.forks}
- Open Issues: ${repoData.openIssues}
- Last Updated: ${repoData.lastUpdate}
- Default Branch: ${repoData.defaultBranch}

COMPLETE Project Structure:
${repoData.fileStructure.slice(0, 200).join('\n')}
${repoData.fileStructure.length > 200 ? `\n... and ${repoData.fileStructure.length - 200} more files` : ''}
- Total Files: ${repoData.totalFiles}
- Structure Depth: ${structureDepth} levels
- Has Organized Structure: ${hasProperStructure ? 'Yes' : 'No'}

Architecture Indicators:
- Frontend Detected: ${hasFrontend ? 'Yes' : 'No'}
- Backend Detected: ${hasBackend ? 'Yes' : 'No'}
- Database Detected: ${hasDatabase ? 'Yes' : 'No'}
- Full-Stack: ${hasFrontend && hasBackend ? 'Yes' : 'No'}

Documentation:
- README: ${repoData.readmeContent ? 'Present' : 'MISSING - CRITICAL ISSUE'}
- LICENSE: ${repoData.hasLicense ? 'Present' : 'Missing'}
- CONTRIBUTING: ${repoData.hasContributing ? 'Present' : 'Missing'}
- CODE_OF_CONDUCT: ${repoData.hasCodeOfConduct ? 'Present' : 'Missing'}

README Content (Full):
${repoData.readmeContent ? repoData.readmeContent.substring(0, 8000) : "NO README FOUND - This is a MAJOR red flag indicating incomplete project."}

=== ACTUAL CODE FILES ANALYZED ===
This is the CRITICAL section - you are analyzing REAL CODE, not just file names!

Code Files Analyzed: ${repoData.filesAnalyzed} files (${repoData.filesSkipped} skipped due to size limits)
Total Code Size: ${(repoData.totalCodeSize / 1024).toFixed(2)} KB
High Priority Files: ${highPriorityFiles.length}
Medium Priority Files: ${mediumPriorityFiles.length}
Config Files: ${configFiles.length}
Test Files: ${testFiles.length}

IMPORTANT: The following is ACTUAL CODE CONTENT from the repository. Analyze the code quality, patterns, architecture, and implementation details:

${codeContentForAnalysis}

${repoData.codeFiles.length > uniqueFiles.length ? `\nNote: ${repoData.codeFiles.length - uniqueFiles.length} additional files were analyzed but not shown in detail due to size limits.` : ''}

Testing:
- Test Files Found: ${testInfo.count}
- Test Types: ${testInfo.types.join(', ') || 'None'}
- Test Coverage: ${testInfo.coverage}

CI/CD:
- Has CI/CD: ${repoData.hasCICD ? 'Yes' : 'No'}
- CI/CD Configs: ${repoData.cicdConfigs.join(', ') || 'None'}

Git Practices:
- Total Branches: ${repoData.branches.length}
- Protected Branches: ${repoData.branches.filter(b => b.protected).length}
- Recent Commits (last 30): ${repoData.commits.length}
- Pull Requests: ${repoData.pullRequests.length} (${repoData.pullRequests.filter(pr => pr.merged).length} merged)

Recent Commit Messages:
${commitMessages || 'No commits found - project may be empty or abandoned'}

Commit Quality:
- Average message length: ${commitQuality.avgLength} chars
- Clear messages: ${commitQuality.clearMessages}%
- Has conventional commits: ${commitQuality.hasConventional ? 'Yes' : 'No'}

=== ANALYSIS DIMENSIONS ===

Evaluate these critical aspects with HIGH ACCURACY. Scores must be consistent with working status:

1. CODE QUALITY & READABILITY (ANALYZE ACTUAL CODE)
   - Code cleanliness, readability, maintainability (from actual code files)
   - Naming conventions and consistency (visible in code)
   - Separation of concerns (architecture in code)
   - Code organization and structure (file structure and code patterns)
   - Presence of code smells or anti-patterns (found in actual code)
   - Code complexity and maintainability (based on real code review)

2. PROJECT STRUCTURE & ORGANIZATION
   - Logical and scalable structure
   - Industry best practices
   - Architecture design quality
   - File organization
   - Engineering judgment in structure

3. DOCUMENTATION & CLARITY
   - README completeness and clarity
   - Setup instructions
   - Usage documentation
   - Code comments (if visible)
   - Professional communication

4. TESTING (NOT THE PRIMARY FOCUS - just one factor)
   - Presence of tests (unit, integration, e2e)
   - Test organization
   - Testing is important but NOT the main focus

5. REAL-WORLD RELEVANCE & USEFULNESS
   - Solves a real problem
   - Practical and useful
   - Production value
   - Real-world constraints understanding
   - Industry-ready vs demo

6. COMMIT & DEVELOPMENT CONSISTENCY
   - Commit message quality
   - Development practices
   - Git workflow
   - Code review evidence

7. FUNCTIONALITY & COMPLETENESS (CRITICAL FOR ACCURACY - BASED ON ACTUAL CODE)
   - Does the project actually WORK? (Analyze code for working implementations)
   - Is it complete or incomplete? (Check if core features have actual code implementations)
   - Are core features implemented? (Verify code exists for claimed features)
   - Can it be used as intended? (Check for main entry points, API endpoints, etc. in code)
   - IMPORTANT: If "Partially Working" or "Not Working", completeness score MUST be low (not 90%!)
   - Completeness score should reflect actual completion status based on CODE ANALYSIS
   - Look for TODO comments, incomplete functions, placeholder code, error handling

8. ARCHITECTURE
   - Architecture patterns used
   - Scalability
   - Design quality
   - Separation of concerns

9. OPTIMIZATION
   - Code efficiency
   - Performance considerations
   - Resource usage
   - Best practices

10. CONNECTIVITY (if applicable)
    - Frontend-backend integration
    - API design
    - Data flow
    - Error handling

You MUST also analyze:

1. ARCHITECTURE ANALYSIS (CRITICAL)
   - What is the overall architecture pattern? (MVC, Microservices, Monolith, etc.)
   - Is the architecture well-designed and scalable?
   - Are frontend and backend properly separated?
   - Is there proper separation of concerns?
   - Are there clear layers (presentation, business logic, data)?
   - Does the structure follow best practices for the tech stack?
   - Are there architectural anti-patterns or code smells?

2. AI USAGE DETECTION (CRITICAL)
   - Is AI/ML being used in this project?
   - What AI technologies are detected? (OpenAI, Anthropic, LangChain, etc.)
   - How is AI integrated? (API calls, embeddings, fine-tuning, etc.)
   - Is AI usage appropriate and well-implemented?
   - Are there AI-related dependencies or configurations?

3. CODE OPTIMIZATION (CRITICAL)
   - Is the code optimized for performance?
   - Are there obvious performance bottlenecks?
   - Is the code efficient and follows best practices?
   - Are there unnecessary dependencies or bloat?
   - Is memory/CPU usage optimized?

4. FUNCTIONALITY & USEFULNESS (CRITICAL)
   - Does the project actually WORK? Is it functional?
   - What is the project's purpose and does it fulfill it?
   - Is the code useful and practical?
   - Are there working features or is it just a skeleton?
   - Can someone actually USE this project?

5. FRONTEND-BACKEND CONNECTIVITY (CRITICAL)
   - If both frontend and backend exist, are they properly connected?
   - Are API endpoints properly defined?
   - Is there proper error handling between layers?
   - Are there integration issues?
   - Is the data flow correct?

6. PROJECT COMPLETENESS (CRITICAL)
   - Is this project COMPLETE or just a work-in-progress?
   - Are all necessary files present?
   - Is the project deployable?
   - Are there missing critical components?
   - Does it have a clear purpose and implementation?

7. ISSUES & PROBLEMS (CRITICAL)
   - What specific issues exist in the codebase?
   - Are there bugs or broken functionality?
   - Are there security vulnerabilities?
   - Are there configuration problems?
   - What would prevent this from working?

8. WORKING STATUS (CRITICAL)
   - Is the project FULLY FUNCTIONAL, PARTIALLY WORKING, NOT WORKING, or UNKNOWN?
   - Provide detailed reasoning for the status
   - What evidence supports your assessment?

9. CODE QUALITY
   - Code organization and readability
   - Naming conventions
   - Code complexity
   - Maintainability

10. DOCUMENTATION
    - README completeness
    - Setup instructions
    - Usage examples
    - API documentation

11. TESTING
    - Test coverage
    - Test quality
    - Test organization

=== OUTPUT REQUIREMENTS ===

Provide a JSON response with this EXACT structure. Be HIGHLY ACCURATE with scoring:

{
  "score": integer (0-100),
  "level": "Beginner" | "Intermediate" | "Advanced" | "Expert",
  "summary": "A concise 2-3 paragraph summary covering: overall assessment, main strengths, main issues, and working status. Be honest and direct.",
  "techStackAnalysis": "Brief analysis of tech stack choices and appropriateness.",
  "strengths": ["3-5 specific strengths - be concise"],
  "weaknesses": ["3-5 specific weaknesses - focus on main issues, not just testing"],
  "codeQualityScore": integer (0-100),
  "codeQualityExplanation": "Brief explanation of code quality score",
  "codeQualityPoints": ["Point 1", "Point 2", "Point 3"],
  "structureScore": integer (0-100),
  "structureExplanation": "Brief explanation",
  "structurePoints": ["Point 1", "Point 2", "Point 3"],
  "documentationScore": integer (0-100),
  "documentationExplanation": "Brief explanation",
  "documentationPoints": ["Point 1", "Point 2", "Point 3"],
  "testingScore": integer (0-100),
  "testingExplanation": "Brief explanation",
  "testingPoints": ["Point 1", "Point 2", "Point 3"],
  "gitPracticesScore": integer (0-100),
  "gitPracticesExplanation": "Brief explanation",
  "gitPracticesPoints": ["Point 1", "Point 2", "Point 3"],
  "realWorldRelevanceScore": integer (0-100),
  "realWorldRelevanceExplanation": "Brief explanation",
  "realWorldRelevancePoints": ["Point 1", "Point 2", "Point 3"],
  "architectureScore": integer (0-100),
  "architectureExplanation": "Brief explanation",
  "architecturePoints": ["Point 1", "Point 2", "Point 3"],
  "optimizationScore": integer (0-100),
  "optimizationExplanation": "Brief explanation",
  "optimizationPoints": ["Point 1", "Point 2", "Point 3"],
  "functionalityScore": integer (0-100),
  "functionalityExplanation": "Brief explanation",
  "functionalityPoints": ["Point 1", "Point 2", "Point 3"],
  "connectivityScore": integer (0-100),
  "connectivityExplanation": "Brief explanation",
  "connectivityPoints": ["Point 1", "Point 2", "Point 3"],
  "completenessScore": integer (0-100),
  "completenessExplanation": "Brief explanation - MUST be consistent with working status",
  "completenessPoints": ["Point 1", "Point 2", "Point 3"],
  "issuesFound": ["All issues found"],
  "mainIssues": ["Top 5-7 main issues - focus on functionality, architecture, code quality - NOT primarily unit testing"],
  "nextSteps": ["Clear next steps to fix main issues - actionable and prioritized"],
  "aiUsageDetected": boolean,
  "aiUsageDetails": "Brief explanation",
  "architectureAnalysis": "Brief paragraph",
  "optimizationAnalysis": "Brief paragraph",
  "functionalityAnalysis": "Brief paragraph",
  "connectivityAnalysis": "Brief paragraph",
  "completenessAnalysis": "Brief paragraph",
  "workingStatus": "Fully Functional" | "Partially Working" | "Not Working" | "Unknown",
  "workingStatusDetails": "Brief explanation with evidence",
  "roadmap": [
    {
      "title": "Specific step",
      "description": "Clear guidance",
      "priority": "High" | "Medium" | "Low",
      "category": "Architecture" | "Code Quality" | "Documentation" | "Testing" | "DevOps" | "Features" | "Functionality" | "Optimization"
    }
  ]
}

=== CRITICAL GUIDELINES ===

1. SCORING ACCURACY IS CRITICAL:
   - If workingStatus is "Partially Working", completenessScore should be 40-60% (NOT 90%!)
   - If workingStatus is "Not Working", completenessScore should be 0-30%
   - If workingStatus is "Fully Functional", completenessScore can be 70-100%
   - Scores must be logically consistent with each other

2. FOCUS ON MAIN ISSUES (NOT primarily unit testing):
   - Main issues: Functionality problems, architecture issues, code quality, missing features, broken functionality
   - Testing is ONE factor, not the primary focus
   - Prioritize issues that prevent the project from working

3. STRUCTURED POINTS:
   - Each score must have 3-5 clear, structured points
   - Points should explain WHY the score was given
   - Be specific and evidence-based

4. MAIN ISSUES vs ALL ISSUES:
   - mainIssues: Top 5-7 critical issues that need immediate attention (functionality, architecture, code quality)
   - issuesFound: All issues found (comprehensive list)
   - Focus mainIssues on what prevents the project from being production-ready

5. NEXT STEPS:
   - Clear, actionable steps to fix main issues
   - Prioritized by impact
   - Not focused on unit testing unless it's a critical blocker

6. BE HONEST AND ACCURATE:
   - If something doesn't work, say so clearly
   - Don't inflate scores
   - Be specific about what's broken or missing

7. STRUCTURED ANALYSIS:
   - Each dimension should have clear points
   - Explain reasoning for scores
   - Make it easy to understand why each score was given

Generate your comprehensive analysis now:
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            level: { type: Type.STRING, enum: ["Beginner", "Intermediate", "Advanced", "Expert"] },
            summary: { type: Type.STRING },
            techStackAnalysis: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            codeQualityScore: { type: Type.INTEGER },
            codeQualityExplanation: { type: Type.STRING },
            codeQualityPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            structureScore: { type: Type.INTEGER },
            structureExplanation: { type: Type.STRING },
            structurePoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            documentationScore: { type: Type.INTEGER },
            documentationExplanation: { type: Type.STRING },
            documentationPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            testingScore: { type: Type.INTEGER },
            testingExplanation: { type: Type.STRING },
            testingPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            gitPracticesScore: { type: Type.INTEGER },
            gitPracticesExplanation: { type: Type.STRING },
            gitPracticesPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            realWorldRelevanceScore: { type: Type.INTEGER },
            realWorldRelevanceExplanation: { type: Type.STRING },
            realWorldRelevancePoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            architectureScore: { type: Type.INTEGER },
            architectureExplanation: { type: Type.STRING },
            architecturePoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            optimizationScore: { type: Type.INTEGER },
            optimizationExplanation: { type: Type.STRING },
            optimizationPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            functionalityScore: { type: Type.INTEGER },
            functionalityExplanation: { type: Type.STRING },
            functionalityPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            connectivityScore: { type: Type.INTEGER },
            connectivityExplanation: { type: Type.STRING },
            connectivityPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            completenessScore: { type: Type.INTEGER },
            completenessExplanation: { type: Type.STRING },
            completenessPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            issuesFound: { type: Type.ARRAY, items: { type: Type.STRING } },
            mainIssues: { type: Type.ARRAY, items: { type: Type.STRING } },
            nextSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
            aiUsageDetected: { type: Type.BOOLEAN },
            aiUsageDetails: { type: Type.STRING },
            architectureAnalysis: { type: Type.STRING },
            optimizationAnalysis: { type: Type.STRING },
            functionalityAnalysis: { type: Type.STRING },
            connectivityAnalysis: { type: Type.STRING },
            completenessAnalysis: { type: Type.STRING },
            workingStatus: { type: Type.STRING, enum: ["Fully Functional", "Partially Working", "Not Working", "Unknown"] },
            workingStatusDetails: { type: Type.STRING },
            roadmap: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  priority: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
                  category: { type: Type.STRING, enum: ["Architecture", "Code Quality", "Documentation", "Testing", "DevOps", "Features", "Functionality", "Optimization"] }
                },
                required: ["title", "description", "priority", "category"]
              }
            }
          },
          required: ["score", "level", "summary", "techStackAnalysis", "strengths", "weaknesses", "codeQualityScore", "codeQualityExplanation", "codeQualityPoints", "structureScore", "structureExplanation", "structurePoints", "documentationScore", "documentationExplanation", "documentationPoints", "testingScore", "testingExplanation", "testingPoints", "gitPracticesScore", "gitPracticesExplanation", "gitPracticesPoints", "realWorldRelevanceScore", "realWorldRelevanceExplanation", "realWorldRelevancePoints", "architectureScore", "architectureExplanation", "architecturePoints", "optimizationScore", "optimizationExplanation", "optimizationPoints", "functionalityScore", "functionalityExplanation", "functionalityPoints", "connectivityScore", "connectivityExplanation", "connectivityPoints", "completenessScore", "completenessExplanation", "completenessPoints", "issuesFound", "mainIssues", "nextSteps", "aiUsageDetected", "aiUsageDetails", "architectureAnalysis", "optimizationAnalysis", "functionalityAnalysis", "connectivityAnalysis", "completenessAnalysis", "workingStatus", "workingStatusDetails", "roadmap"]
        }
      }
    });

    if (!response.text) {
      throw new Error("No response from AI");
    }

    const result = JSON.parse(response.text) as AnalysisResult;
    
    // Ensure all required fields are present with defaults
    return {
      ...result,
      codeQualityScore: result.codeQualityScore ?? 0,
      codeQualityExplanation: result.codeQualityExplanation ?? '',
      codeQualityPoints: result.codeQualityPoints ?? [],
      structureScore: result.structureScore ?? 0,
      structureExplanation: result.structureExplanation ?? '',
      structurePoints: result.structurePoints ?? [],
      documentationScore: result.documentationScore ?? 0,
      documentationExplanation: result.documentationExplanation ?? '',
      documentationPoints: result.documentationPoints ?? [],
      testingScore: result.testingScore ?? 0,
      testingExplanation: result.testingExplanation ?? '',
      testingPoints: result.testingPoints ?? [],
      gitPracticesScore: result.gitPracticesScore ?? 0,
      gitPracticesExplanation: result.gitPracticesExplanation ?? '',
      gitPracticesPoints: result.gitPracticesPoints ?? [],
      realWorldRelevanceScore: result.realWorldRelevanceScore ?? 0,
      realWorldRelevanceExplanation: result.realWorldRelevanceExplanation ?? '',
      realWorldRelevancePoints: result.realWorldRelevancePoints ?? [],
      architectureScore: result.architectureScore ?? 0,
      architectureExplanation: result.architectureExplanation ?? '',
      architecturePoints: result.architecturePoints ?? [],
      optimizationScore: result.optimizationScore ?? 0,
      optimizationExplanation: result.optimizationExplanation ?? '',
      optimizationPoints: result.optimizationPoints ?? [],
      functionalityScore: result.functionalityScore ?? 0,
      functionalityExplanation: result.functionalityExplanation ?? '',
      functionalityPoints: result.functionalityPoints ?? [],
      connectivityScore: result.connectivityScore ?? 0,
      connectivityExplanation: result.connectivityExplanation ?? '',
      connectivityPoints: result.connectivityPoints ?? [],
      completenessScore: result.completenessScore ?? 0,
      completenessExplanation: result.completenessExplanation ?? '',
      completenessPoints: result.completenessPoints ?? [],
      issuesFound: result.issuesFound ?? [],
      mainIssues: result.mainIssues ?? [],
      nextSteps: result.nextSteps ?? [],
      aiUsageDetected: result.aiUsageDetected ?? false,
      aiUsageDetails: result.aiUsageDetails ?? 'No AI usage detected',
      architectureAnalysis: result.architectureAnalysis ?? 'Architecture analysis not available',
      optimizationAnalysis: result.optimizationAnalysis ?? 'Optimization analysis not available',
      functionalityAnalysis: result.functionalityAnalysis ?? 'Functionality analysis not available',
      connectivityAnalysis: result.connectivityAnalysis ?? 'Connectivity analysis not available',
      completenessAnalysis: result.completenessAnalysis ?? 'Completeness analysis not available',
      workingStatus: result.workingStatus ?? 'Unknown',
      workingStatusDetails: result.workingStatusDetails ?? 'Working status could not be determined',
    };

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to generate analysis. Please try again.");
  }
};

// Helper function to analyze commit quality
function analyzeCommitQuality(commits: Array<{ message: string }>): {
  avgLength: number;
  clearMessages: number;
  hasConventional: boolean;
} {
  if (commits.length === 0) {
    return { avgLength: 0, clearMessages: 0, hasConventional: false };
  }

  const lengths = commits.map(c => c.message.length);
  const avgLength = Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
  
  // Check for clear messages (not too short, not too long, has some structure)
  const clearCount = commits.filter(c => {
    const msg = c.message;
    return msg.length > 10 && msg.length < 100 && !msg.includes('WIP') && !msg.includes('fix');
  }).length;
  const clearMessages = Math.round((clearCount / commits.length) * 100);

  // Check for conventional commits pattern
  const conventionalPattern = /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(.+\))?:/i;
  const hasConventional = commits.some(c => conventionalPattern.test(c.message));

  return { avgLength, clearMessages, hasConventional };
}
