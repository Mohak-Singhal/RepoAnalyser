import { RepoMetadata, CommitInfo, BranchInfo, PullRequestInfo, TestFileInfo } from '../types';

const GITHUB_API_BASE = 'https://api.github.com/repos';

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

// Recursively fetch file structure
const fetchFileStructureRecursive = async (
  owner: string, 
  repo: string, 
  path: string = '', 
  maxDepth: number = 3,
  currentDepth: number = 0
): Promise<string[]> => {
  if (currentDepth >= maxDepth) return [];
  
  try {
    const url = path 
      ? `${GITHUB_API_BASE}/${owner}/${repo}/contents/${path}`
      : `${GITHUB_API_BASE}/${owner}/${repo}/contents`;
    
    const response = await fetch(url);
    if (!response.ok) return [];
    
    const contents = await response.json();
    if (!Array.isArray(contents)) return [];
    
    const structure: string[] = [];
    
    for (const item of contents) {
      const prefix = '  '.repeat(currentDepth);
      if (item.type === 'dir') {
        structure.push(`${prefix}📁 ${item.name}/`);
        // Recursively fetch subdirectories (limit depth)
        if (currentDepth < maxDepth - 1) {
          const subStructure = await fetchFileStructureRecursive(
            owner, 
            repo, 
            item.path, 
            maxDepth, 
            currentDepth + 1
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

    // 2. Fetch README
    let readmeContent = null;
    try {
      const readmeResponse = await fetch(`${GITHUB_API_BASE}/${owner}/${repo}/readme`);
      if (readmeResponse.ok) {
        const readmeJson = await readmeResponse.json();
        // GitHub API returns content in base64, remove whitespace before decoding
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

    // 4. Fetch Recursive File Structure
    const fileStructure = await fetchFileStructureRecursive(owner, repo, '', 3, 0);
    const totalFiles = fileStructure.filter(f => f.includes('📄')).length;
    
    // 5. Detect test files
    const testFiles = detectTestFiles(fileStructure);
    
    // 6. Detect CI/CD
    const { hasCICD, configs: cicdConfigs } = detectCICDConfigs(fileStructure);
    
    // 7. Check for important files
    const structureStr = fileStructure.join('\n');
    const hasLicense = structureStr.includes('LICENSE') || structureStr.includes('LICENCE');
    const hasContributing = structureStr.includes('CONTRIBUTING');
    const hasCodeOfConduct = structureStr.includes('CODE_OF_CONDUCT');

    // 8. Fetch Commits (last 30)
    let commits: CommitInfo[] = [];
    try {
      const commitsResponse = await fetch(
        `${GITHUB_API_BASE}/${owner}/${repo}/commits?per_page=30&sort=updated`
      );
      if (commitsResponse.ok) {
        const commitsJson = await commitsResponse.json();
        commits = commitsJson.map((commit: any) => ({
          sha: commit.sha.substring(0, 7),
          message: commit.commit.message.split('\n')[0], // First line only
          author: commit.commit.author.name,
          date: commit.commit.author.date,
          url: commit.html_url,
        }));
      }
    } catch (e) {
      console.warn("Could not fetch commits", e);
    }

    // 9. Fetch Branches
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

    // 10. Fetch Pull Requests (last 20)
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
      defaultBranch: metaJson.default_branch || 'main',
    };

  } catch (error: any) {
    throw error;
  }
};