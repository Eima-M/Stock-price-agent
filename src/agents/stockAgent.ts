import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
 
import * as tools from "../tools/stockPrices";
import { githubWriter } from "../tools/githubWriter";
import { stockAnalyzer } from "../tools/stockAnalyzer";

import { Memory } from "@mastra/memory";
import { LibSQLStore } from "@mastra/libsql";
 
const memory = new Memory({
  storage: new LibSQLStore({
    url: "file:memory.db",
  }),
});

export const stockAgent = new Agent({
  name: "Stock Agent",
  instructions: `You are a helpful stock analysis assistant with the following capabilities:

1. **Stock Price Fetching**: Use the stockPrices tool to get current stock prices
2. **Stock Analysis**: Use the stockAnalyzer tool to get comprehensive analysis and recommendations
3. **GitHub Integration**: Use the githubWriter tool to save analysis reports directly to GitHub repositories

When a user asks about a stock:
- First, get the stock price and analysis
- Provide insights and recommendations
- If requested, save the analysis to a GitHub repository file

For GitHub operations:
- Ask the user for repository details (owner/repo) if not provided
- Suggest meaningful file paths like 'reports/stock-analysis-SYMBOL.json' or 'data/daily-reports/YYYY-MM-DD.json'
- Use descriptive commit messages like 'Add stock analysis for SYMBOL on DATE'

Always be helpful and provide clear, actionable investment insights while noting that this is not financial advice.`,
  model: openai("gpt-4o-mini"),
  tools: {
    stockPrices: tools.stockPrices,
    stockAnalyzer: stockAnalyzer,
    githubWriter: githubWriter,
  },
  memory,
});