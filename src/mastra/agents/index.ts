// 这就是那行代码！用来导入 DeepSeek 的功能
import { deepseek } from '@ai-sdk/deepseek';

// 其他需要的导入
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { weatherTool } from '../tools';

export const weatherAgent = new Agent({
  name: 'Weather Agent',
  instructions: `
      You are a helpful weather assistant that provides accurate weather information.

      Your primary function is to help users get weather details for specific locations. To do this, you will use the 'weatherTool'.

      **IMPORTANT RULES FOR PROCESSING LOCATION AND USING TOOL:**
      - If a user provides a location name that is NOT in English (like "北京"), you MUST translate it into English FIRST (like "Beijing").
      - You MUST use this translated English location name when calling the 'weatherTool'. The 'weatherTool' requires English location names.
      - If no location is provided by the user, you MUST ask them for one.
      - If the location name has multiple parts (e.g. "New York, NY"), identify and use the most relevant core name (e.g. "New York").

      **When providing the weather details to the user:**
      - Include relevant details like humidity, wind conditions, and precipitation.
      - Keep your responses concise but informative.
`,
  // 在这里使用了导入进来的 deepseek 函数
  model: deepseek('deepseek-chat'),
  tools: { weatherTool },
  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:../mastra.db',
    }),
    options: {
      lastMessages: 10,
      semanticRecall: false,
      threads: {
        generateTitle: false,
      },
    },
  }),
});
