import { investmentGraph } from './graph/graph.js';
import * as dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

async function main() {
  const companyName = 'Apple';
  console.log(`Starting stream for: ${companyName}`);

  try {
    const stream = await investmentGraph.stream(
      { companyName },
      { streamMode: 'values' }
    );

    let finalState: any = null;

    for await (const state of stream) {
      console.log(`[State Update] currentNode: ${state.currentNode}`);
      finalState = state;
    }

    console.log('\nFinal Report exists:', !!finalState.finalReport);
  } catch (error) {
    console.error('Stream failed:', error);
  }
}

main();
