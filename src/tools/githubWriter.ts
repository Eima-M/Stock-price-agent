import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { Octokit } from "@octokit/rest";

// Initialize GitHub client
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN, // You'll need to set this environment variable
});

const writeToGitHub = async (
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string
) => {
  try {
    // First, try to get the existing file to get its SHA (required for updates)
    let sha: string | undefined;
    try {
      const { data: existingFile } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path,
      });
      
      if ('sha' in existingFile) {
        sha = existingFile.sha;
      }
    } catch (error) {
      // File doesn't exist, which is fine for new files
      console.log("File doesn't exist, creating new file");
    }

    // Create or update the file
    const { data } = await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      content: Buffer.from(content).toString('base64'),
      sha, // Include SHA if updating existing file
    });

    return {
      success: true,
      url: data.content?.html_url,
      sha: data.content?.sha,
      message: `Successfully ${sha ? 'updated' : 'created'} file: ${path}`,
    };
  } catch (error) {
    console.error('GitHub API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

const appendToGitHubFile = async (
  owner: string,
  repo: string,
  path: string,
  newContent: string,
  message: string
) => {
  try {
    let existingContent = "";
    let sha: string | undefined;

    // Try to get existing file content
    try {
      const { data: existingFile } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path,
      });
      
      if ('content' in existingFile && 'sha' in existingFile) {
        existingContent = Buffer.from(existingFile.content, 'base64').toString('utf-8');
        sha = existingFile.sha;
      }
    } catch (error) {
      console.log("File doesn't exist, will create new file");
    }

    // Combine existing content with new content
    const separator = existingContent.trim() ? '\n\n---\n\n' : '';
    const combinedContent = existingContent + separator + newContent;

    // Update the file
    const { data } = await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      content: Buffer.from(combinedContent).toString('base64'),
      sha,
    });

    return {
      success: true,
      url: data.content?.html_url,
      sha: data.content?.sha,
      message: `Successfully appended to file: ${path}`,
    };
  } catch (error) {
    console.error('GitHub API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

export const githubWriter = createTool({
  id: "Write to GitHub Repository",
  inputSchema: z.object({
    owner: z.string().describe("GitHub repository owner (username or organization)"),
    repo: z.string().describe("GitHub repository name"),
    path: z.string().describe("File path within the repository (e.g., 'data/stock-prices.json')"),
    content: z.string().describe("Content to write to the file"),
    message: z.string().describe("Commit message"),
  }),
  description: `Writes content to a file in a GitHub repository. Can create new files or update existing ones.`,
  execute: async ({ context: { owner, repo, path, content, message } }) => {
    console.log(`Writing to GitHub: ${owner}/${repo}/${path}`);
    return await writeToGitHub(owner, repo, path, content, message);
  },
});

export const saveStockReport = createTool({
  id: "Save Stock Report to Repository",
  inputSchema: z.object({
    owner: z.string().describe("GitHub repository owner (username or organization)"),
    repo: z.string().describe("GitHub repository name"),
    stockSymbol: z.string().describe("Stock symbol that was analyzed"),
    reportContent: z.string().describe("The stock analysis report content to save"),
  }),
  description: `Automatically saves stock analysis reports to the reports.txt file in your GitHub repository. Appends new reports to existing content.`,
  execute: async ({ context: { owner, repo, stockSymbol, reportContent } }) => {
    console.log(`Saving stock report for ${stockSymbol} to ${owner}/${repo}/reports.txt`);
    
    // Format the report with timestamp and symbol
    const timestamp = new Date().toISOString();
    const formattedReport = `📊 STOCK ANALYSIS REPORT
Generated: ${timestamp}
Symbol: ${stockSymbol}

${reportContent}`;

    const commitMessage = `Add stock analysis report for ${stockSymbol} - ${new Date().toLocaleDateString()}`;
    
    return await appendToGitHubFile(owner, repo, "reports.txt", formattedReport, commitMessage);
  },
});
