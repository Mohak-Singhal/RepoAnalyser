import { RepoMetadata, CommitInfo, BranchInfo, PullRequestInfo, TestFileInfo, CodeFile } from '../types';

const GITHUB_API_BASE = 'https://api.github.com/repos';

// Maximum file size to read (1MB)
const MAX_FILE_SIZE = 1024 * 1024;
// Maximum total code size to analyze (10MB)
const MAX_TOTAL_CODE_SIZE = 10 * 1024 * 1024;
// Maximum number of files to analyze
const MAX_FILES_TO_ANALYZE = 500;

// File extensions to skip (binaries, generated files, etc.)
const SKIP_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.bmp',
  '.pdf', '.zip', '.tar', '.gz', '.rar', '.7z',
  '.exe', '.dll', '.so', '.dylib', '.bin',
  '.woff', '.woff2', '.ttf', '.eot',
  '.mp4', '.mp3', '.avi', '.mov', '.wmv',
  '.pyc', '.pyo', '.class', '.jar', '.war',
  '.min.js', '.min.css', '.bundle.js',
  '.lock', '.log', '.cache'
]);

// Directories to skip
const SKIP_DIRECTORIES = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', 'out',
  'coverage', '.nyc_output', '.cache', '.vscode', '.idea',
  'vendor', '__pycache__', '.pytest_cache', '.mypy_cache',
  'target', '.gradle', '.idea', 'venv', 'env', '.venv',
  'bower_components', '.sass-cache', '.parcel-cache'
]);

// High priority file patterns (read these first)
const HIGH_PRIORITY_PATTERNS = [
  /^(src|lib|app|components|pages|routes|controllers|services|models|utils|helpers)/i,
  /\.(ts|tsx|js|jsx|py|java|go|rs|rb|php|cs|cpp|c|h|swift|kt|scala)$/i,
  /^(package\.json|requirements\.txt|pom\.xml|build\.gradle|Cargo\.toml|go\.mod|Gemfile|composer\.json)$/i,
  /^(dockerfile|docker-compose|\.env\.example|\.gitignore|\.eslintrc|\.prettierrc)$/i
];

// Config file patterns
const CONFIG_PATTERNS = [
  /^(package\.json|tsconfig|webpack|vite|rollup|babel|eslint|prettier|jest|vitest|cypress|playwright)/i,
  /\.(config|conf|ini|yaml|yml|toml|json)$/i,
  /^(dockerfile|docker-compose|\.env|\.gitignore|\.npmrc|\.nvmrc)$/i
];

// Test file patterns
const TEST_PATTERNS = [
  /(test|spec)\.(js|ts|jsx|tsx|py|java|go|rb)$/i,
  /\.(test|spec)\.(js|ts|jsx|tsx|py|java|go|rb)$/i,
  /^(test|spec|tests|__tests__|__spec__)/i
];

// Documentation file patterns
const DOC_PATTERNS = [
  /^(readme|changelog|contributing|license|authors|credits)/i,
  /\.(md|txt|rst|adoc)$/i
];

// Helper to parse GitHub URL
export const parseGithubUrl = (url: string): { owner: string; repo: string } | null => {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname !== 'github.com') return null;
    const parts = urlObj.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;
    return { owner: parts[0], repo: parts[1] };
  } catch (e) {
    return null;
  }
};

// Check if file should be skipped
const shouldSkipFile = (path: string, size: number): boolean => {
  // Skip if too large
  if (size > MAX_FILE_SIZE) return true;
  
  // Skip if in ignored directory
  const pathParts = path.toLowerCase().split('/');
  if (pathParts.some(part => SKIP_DIRECTORIES.has(part))) return true;
  
  // Skip binary/extensions
  const ext = path.substring(path.lastIndexOf('.')).toLowerCase();
  if (SKIP_EXTENSIONS.has(ext)) return true;
  
  // Skip if matches skip pattern
  if (path.includes('.min.') || path.includes('.bundle.') || path.includes('.chunk.')) return true;
  
  return false;
};

// Determine file priority
const getFilePriority = (path: string): 'high' | 'medium' | 'low' => {
  if (HIGH_PRIORITY_PATTERNS.some(pattern => pattern.test(path))) {
    return 'high';
  }
  if (CONFIG_PATTERNS.some(pattern => pattern.test(path)) || 
      DOC_PATTERNS.some(pattern => pattern.test(path))) {
    return 'medium';
  }
  return 'low';
};

// Detect if file is a test file
const isTestFile = (path: string): boolean => {
  return TEST_PATTERNS.some(pattern => pattern.test(path));
};

// Detect if file is a config file
const isConfigFile = (path: string): boolean => {
  return CONFIG_PATTERNS.some(pattern => pattern.test(path));
};

// Detect if file is documentation
const isDocumentationFile = (path: string): boolean => {
  return DOC_PATTERNS.some(pattern => pattern.test(path));
};

// Detect language from file extension
const detectLanguage = (path: string): string | undefined => {
  const ext = path.substring(path.lastIndexOf('.')).toLowerCase();
  const langMap: { [key: string]: string } = {
    '.ts': 'TypeScript', '.tsx': 'TypeScript', '.js': 'JavaScript', '.jsx': 'JavaScript',
    '.py': 'Python', '.java': 'Java', '.go': 'Go', '.rs': 'Rust',
    '.rb': 'Ruby', '.php': 'PHP', '.cs': 'C#', '.cpp': 'C++', '.c': 'C',
    '.swift': 'Swift', '.kt': 'Kotlin', '.scala': 'Scala',
    '.html': 'HTML', '.css': 'CSS', '.scss': 'SCSS', '.sass': 'SASS',
    '.json': 'JSON', '.yaml': 'YAML', '.yml': 'YAML', '.xml': 'XML',
    '.md': 'Markdown', '.sh': 'Shell', '.sql': 'SQL'
  };
  return langMap[ext];
};

// Recursively fetch all files with their contents
const fetchAllFilesRecursive = async (
  owner: string,
  repo: string,
  path: string = '',
  defaultBranch: string = 'main'
): Promise<CodeFile[]> => {
  const files: CodeFile[] = [];
  let totalSize = 0;
  
  try {
    const url = path
      ? `${GITHUB_API_BASE}/${owner}/${repo}/contents/${path}?ref=${defaultBranch}`
      : `${GITHUB_API_BASE}/${owner}/${repo}/contents?ref=${defaultBranch}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) return [];
      if (response.status === 403) {
        console.warn(`Rate limited or forbidden: ${path}`);
        return [];
      }
      return [];
    }
    
    const contents = await response.json();
    if (!Array.isArray(contents)) return [];
    
    // Process files and directories
    for (const item of contents) {
      if (item.type === 'dir') {
        // Skip ignored directories
        if (SKIP_DIRECTORIES.has(item.name.toLowerCase())) continue;
        
        // Recursively fetch subdirectories
        const subFiles = await fetchAllFilesRecursive(owner, repo, item.path, defaultBranch);
        files.push(...subFiles);
        
        // Check if we've exceeded limits
        totalSize = files.reduce((sum, f) => sum + f.size, 0);
        if (files.length >= MAX_FILES_TO_ANALYZE || totalSize >= MAX_TOTAL_CODE_SIZE) {
          break;
        }
      } else if (item.type === 'file') {
        // Skip if should be ignored
        if (shouldSkipFile(item.path, item.size)) continue;
        
        // Check limits
        if (files.length >= MAX_FILES_TO_ANALYZE) break;
        if (totalSize + item.size > MAX_TOTAL_CODE_SIZE) continue;
        
        try {
          // Fetch file content using the contents API endpoint
          const fileUrl = `${GITHUB_API_BASE}/${owner}/${repo}/contents/${item.path}?ref=${defaultBranch}`;
          const fileResponse = await fetch(fileUrl);
          if (!fileResponse.ok) continue;
          
          const fileData = await fileResponse.json();
          if (!fileData.content) continue;
          
          // Decode base64 content
          const content = atob(fileData.content.replace(/\s/g, ''));
          
          files.push({
            path: item.path,
            content: content,
            size: item.size,
            language: detectLanguage(item.path),
            isTest: isTestFile(item.path),
            isConfig: isConfigFile(item.path),
            isDocumentation: isDocumentationFile(item.path),
            priority: getFilePriority(item.path)
          });
          
          totalSize += item.size;
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (e) {
          console.warn(`Could not fetch content for ${item.path}`, e);
        }
      }
    }
  } catch (e) {
    console.warn(`Could not fetch contents for ${path}`, e);
  }
  
  return files;
};

// Recursively fetch file structure (for display)
const fetchFileStructureRecursive = async (
  owner: string, 
  repo: string, 
  path: string = '', 
  maxDepth: number = 5,
  currentDepth: number = 0,
  defaultBranch: string = 'main'
): Promise<string[]> => {
  if (currentDepth >= maxDepth) return [];
  
  try {
    const url = path 
      ? `${GITHUB_API_BASE}/${owner}/${repo}/contents/${path}?ref=${defaultBranch}`
      : `${GITHUB_API_BASE}/${owner}/${repo}/contents?ref=${defaultBranch}`;
    
    const response = await fetch(url);
    if (!response.ok) return [];
    
    const contents = await response.json();
    if (!Array.isArray(contents)) return [];
    
    const structure: string[] = [];
    
    for (const item of contents) {
      const prefix = '  '.repeat(currentDepth);
      if (item.type === 'dir') {
        // Skip ignored directories
        if (SKIP_DIRECTORIES.has(item.name.toLowerCase())) continue;
        
        structure.push(`${prefix}📁 ${item.name}/`);
        // Recursively fetch subdirectories
        if (currentDepth < maxDepth - 1) {
          const subStructure = await fetchFileStructureRecursive(
            owner, 
            repo, 
            item.path, 
            maxDepth, 
            currentDepth + 1,
            defaultBranch
          );
          structure.push(...subStructure);
        }
      } else {
        structure.push(`${prefix}📄 ${item.name}`);
      }
    }
    
    return structure;
  } catch (e) {
    console.warn(`Could not fetch contents for ${path}`, e);
    return [];
  }
};

// Detect test files
const detectTestFiles = (fileStructure: string[]): TestFileInfo[] => {
  const testFiles: TestFileInfo[] = [];
  const testPatterns = {
    unit: /(test|spec)\.(js|ts|jsx|tsx|py|java|go|rb)$/i,
    integration: /(integration|integration-test)\.(js|ts|jsx|tsx|py|java|go|rb)$/i,
    e2e: /(e2e|end-to-end|cypress|playwright|selenium)\.(js|ts|jsx|tsx|py|java|go|rb)$/i,
  };
  
  for (const file of fileStructure) {
    const fileName = file.replace(/^[\s📁📄]+/, '');
    if (fileName.includes('test') || fileName.includes('spec')) {
      let type: TestFileInfo['type'] = 'unknown';
      if (testPatterns.e2e.test(fileName)) type = 'e2e';
      else if (testPatterns.integration.test(fileName)) type = 'integration';
      else if (testPatterns.unit.test(fileName)) type = 'unit';
      
      testFiles.push({ path: fileName, type });
    }
  }
  
  return testFiles;
};

// Check for CI/CD configs
const detectCICDConfigs = (fileStructure: string[]): { hasCICD: boolean; configs: string[] } => {
  const cicdPatterns = [
    '.github/workflows',
    '.gitlab-ci.yml',
    '.circleci',
    'Jenkinsfile',
    '.travis.yml',
    'azure-pipelines.yml',
    'bitbucket-pipelines.yml',
    '.drone.yml',
  ];
  
  const configs: string[] = [];
  const structureStr = fileStructure.join('\n');
  
  for (const pattern of cicdPatterns) {
    if (structureStr.includes(pattern)) {
      configs.push(pattern);
    }
  }
  
  return { hasCICD: configs.length > 0, configs };
};

export const fetchRepoData = async (owner: string, repo: string): Promise<RepoMetadata> => {
  try {
    // 1. Fetch Basic Metadata
    const metaResponse = await fetch(`${GITHUB_API_BASE}/${owner}/${repo}`);
    if (!metaResponse.ok) {
      if (metaResponse.status === 404) throw new Error("Repository not found (or private).");
      if (metaResponse.status === 403) throw new Error("GitHub API rate limit exceeded. Please try again later.");
      throw new Error(`GitHub API Error: ${metaResponse.statusText}`);
    }
    const metaJson = await metaResponse.json();
    const defaultBranch = metaJson.default_branch || 'main';

    // 2. Fetch README
    let readmeContent = null;
    try {
      const readmeResponse = await fetch(`${GITHUB_API_BASE}/${owner}/${repo}/readme`);
      if (readmeResponse.ok) {
        const readmeJson = await readmeResponse.json();
        readmeContent = atob(readmeJson.content.replace(/\s/g, ''));
      }
    } catch (e) {
      console.warn("Could not fetch README", e);
    }

    // 3. Fetch Languages
    let languages: { [key: string]: number } = {};
    try {
      const langResponse = await fetch(`${GITHUB_API_BASE}/${owner}/${repo}/languages`);
      if (langResponse.ok) {
        languages = await langResponse.json();
      }
    } catch (e) {
      console.warn("Could not fetch languages", e);
    }

    // 4. Fetch File Structure (for display)
    const fileStructure = await fetchFileStructureRecursive(owner, repo, '', 5, 0, defaultBranch);
    const totalFiles = fileStructure.filter(f => f.includes('📄')).length;
    
    // 5. Fetch ALL CODE FILES with content (this is the key improvement)
    console.log('Fetching code files...');
    const allCodeFiles = await fetchAllFilesRecursive(owner, repo, '', defaultBranch);
    
    // Sort by priority (high priority first)
    allCodeFiles.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    // Limit to top files if we have too many
    const codeFiles = allCodeFiles.slice(0, MAX_FILES_TO_ANALYZE);
    const totalCodeSize = codeFiles.reduce((sum, f) => sum + f.size, 0);
    const filesSkipped = allCodeFiles.length - codeFiles.length;
    
    console.log(`Fetched ${codeFiles.length} code files (${filesSkipped} skipped), total size: ${(totalCodeSize / 1024).toFixed(2)} KB`);
    
    // 6. Detect test files
    const testFiles = detectTestFiles(fileStructure);
    
    // 7. Detect CI/CD
    const { hasCICD, configs: cicdConfigs } = detectCICDConfigs(fileStructure);
    
    // 8. Check for important files
    const structureStr = fileStructure.join('\n');
    const hasLicense = structureStr.includes('LICENSE') || structureStr.includes('LICENCE');
    const hasContributing = structureStr.includes('CONTRIBUTING');
    const hasCodeOfConduct = structureStr.includes('CODE_OF_CONDUCT');

    // 9. Fetch Commits (last 30)
    let commits: CommitInfo[] = [];
    try {
      const commitsResponse = await fetch(
        `${GITHUB_API_BASE}/${owner}/${repo}/commits?per_page=30&sort=updated`
      );
      if (commitsResponse.ok) {
        const commitsJson = await commitsResponse.json();
        commits = commitsJson.map((commit: any) => ({
          sha: commit.sha.substring(0, 7),
          message: commit.commit.message.split('\n')[0],
          author: commit.commit.author.name,
          date: commit.commit.author.date,
          url: commit.html_url,
        }));
      }
    } catch (e) {
      console.warn("Could not fetch commits", e);
    }

    // 10. Fetch Branches
    let branches: BranchInfo[] = [];
    try {
      const branchesResponse = await fetch(`${GITHUB_API_BASE}/${owner}/${repo}/branches?per_page=100`);
      if (branchesResponse.ok) {
        const branchesJson = await branchesResponse.json();
        branches = branchesJson.map((branch: any) => ({
          name: branch.name,
          protected: branch.protected || false,
        }));
      }
    } catch (e) {
      console.warn("Could not fetch branches", e);
    }

    // 11. Fetch Pull Requests (last 20)
    let pullRequests: PullRequestInfo[] = [];
    try {
      const prsResponse = await fetch(
        `${GITHUB_API_BASE}/${owner}/${repo}/pulls?state=all&per_page=20&sort=updated`
      );
      if (prsResponse.ok) {
        const prsJson = await prsResponse.json();
        pullRequests = prsJson.map((pr: any) => ({
          number: pr.number,
          title: pr.title,
          state: pr.state,
          merged: pr.merged || false,
          createdAt: pr.created_at,
        }));
      }
    } catch (e) {
      console.warn("Could not fetch pull requests", e);
    }

    return {
      owner: metaJson.owner.login,
      name: metaJson.name,
      description: metaJson.description || "No description provided.",
      stars: metaJson.stargazers_count,
      forks: metaJson.forks_count,
      language: metaJson.language || "Unknown",
      openIssues: metaJson.open_issues_count,
      topics: metaJson.topics || [],
      readmeContent: readmeContent,
      fileStructure: fileStructure,
      lastUpdate: metaJson.updated_at,
      commits,
      branches,
      pullRequests,
      testFiles,
      hasCICD,
      cicdConfigs,
      languages,
      totalFiles,
      hasLicense,
      hasContributing,
      hasCodeOfConduct,
      defaultBranch,
      codeFiles: codeFiles,
      totalCodeSize: totalCodeSize,
      filesAnalyzed: codeFiles.length,
      filesSkipped: filesSkipped,
    };

  } catch (error: any) {
    throw error;
  }
};
