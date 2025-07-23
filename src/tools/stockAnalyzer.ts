import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const getStockPrice = async (symbol: string) => {
  const data = await fetch(
    `https://mastra-stock-data.vercel.app/api/stock-data?symbol=${symbol}`,
  ).then((r) => r.json());
  return data.prices["4. close"];
};

const analyzeStockData = (symbol: string, price: string, timestamp: string) => {
  const numPrice = parseFloat(price);
  let analysis = "";
  
  if (numPrice > 200) {
    analysis = "High-value stock, consider market conditions before investing.";
  } else if (numPrice > 50) {
    analysis = "Mid-range stock, good for diversified portfolio.";
  } else {
    analysis = "Lower-priced stock, potential growth opportunity.";
  }

  return {
    symbol,
    currentPrice: price,
    timestamp,
    analysis,
    recommendation: numPrice > 100 ? "HOLD/MONITOR" : numPrice > 20 ? "BUY" : "RESEARCH",
  };
};

const formatStockReport = (stockData: any, previousData?: any[]) => {
  const report = `
CURRENT PRICE: $${stockData.currentPrice}
TIMESTAMP: ${stockData.timestamp}

ANALYSIS:
${stockData.analysis}

RECOMMENDATION: ${stockData.recommendation}

INVESTMENT GRADE:
${stockData.recommendation === 'BUY' ? '🟢 BUY - Good entry point' : 
  stockData.recommendation === 'HOLD/MONITOR' ? '🟡 HOLD/MONITOR - Watch for opportunities' : 
  '🔍 RESEARCH - Requires further analysis'}

RISK ASSESSMENT:
${parseFloat(stockData.currentPrice) > 200 ? 'HIGH - Premium stock, higher volatility expected' :
  parseFloat(stockData.currentPrice) > 50 ? 'MEDIUM - Moderate risk/reward profile' :
  'LOWER - Higher growth potential but increased risk'}
`;

  return report.trim();
};

export const stockAnalyzer = createTool({
  id: "Stock Analyzer and Reporter",
  inputSchema: z.object({
    symbol: z.string().describe("Stock symbol to analyze"),
    includeHistory: z.boolean().optional().describe("Whether to include historical data"),
  }),
  description: `Analyzes a stock price and generates a comprehensive report with recommendations`,
  execute: async ({ context: { symbol, includeHistory = false } }) => {
    console.log(`Analyzing stock: ${symbol}`);
    
    const price = await getStockPrice(symbol);
    const timestamp = new Date().toISOString();
    const analysis = analyzeStockData(symbol, price, timestamp);
    
    // You could extend this to read previous data from GitHub or memory
    const previousData = includeHistory ? [] : undefined;
    const report = formatStockReport(analysis, previousData);
    
    return {
      analysis,
      report,
      formattedReport: report,
    };
  },
});
