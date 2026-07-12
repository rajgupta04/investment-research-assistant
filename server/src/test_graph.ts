import { investmentGraph } from './graph/graph.js';
import * as dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

async function main() {
  console.log('=== End-to-End Graph Test ===\n');

  if (!process.env.GOOGLE_API_KEY || !process.env.TAVILY_API_KEY) {
    console.error('Missing API keys in .env');
    process.exit(1);
  }

  const companyName = 'Apple';
  console.log(`Starting analysis for: ${companyName}`);
  const startTime = Date.now();

  try {
    const result = await investmentGraph.invoke({ companyName });
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n=== Analysis Complete in ${elapsed}s ===`);
    
    console.log('\n--- Final Report Executive Summary ---');
    console.log(result.finalReport?.executiveSummary);
    
    console.log('\n--- Financial Analysis ---');
    console.log(result.finalReport?.financialAnalysis);

    console.log('\n--- Decision ---');
    console.log(result.finalReport?.investmentDecision?.recommendation);
    console.log(result.finalReport?.investmentDecision?.thesisSummary);
    console.log('Confidence Score:', result.finalReport?.investmentDecision?.confidence?.total);
    
    console.log('\n--- Node Errors ---');
    console.dir(result.errors, { depth: null });
    
  } catch (error) {
    console.error('Graph execution failed:', error);
  }
}

main();
