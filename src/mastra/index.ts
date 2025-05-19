
import { Mastra } from '@mastra/core/mastra';
import { createLogger } from '@mastra/core/logger';
import { CloudflareDeployer } from "@mastra/deployer-cloudflare";
import { weatherAgent } from './agents';
import { codeReviewAgent } from './agents/codeReviewAgent';

export const mastra = new Mastra({
  deployer: new CloudflareDeployer({
    scope: process.env.CLOUDFLARE_ACCOUNT_ID || 'your-cloudflare-scope',
    projectName: 'cr-agent',
    workerNamespace: 'production',
    auth: {
      apiToken: process.env.CLOUDFLARE_API_TOKEN || '',
      apiEmail: 'wpang520@163.com',
    },
  }),
  agents: { weatherAgent, codeReviewAgent },
  logger: createLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
