import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

interface CodeReviewResponse {
  reviewId: string;
  status: string;
  comments: {
    line: number;
    message: string;
    severity: 'info' | 'warning' | 'error';
  }[];
  overallScore: number;
}

export const codeReviewTool = createTool({
  id: 'get-code-review',
  description: '获取代码片段的代码审查详情',
  inputSchema: z.object({
    code: z.string().describe('需要审查的代码片段'),
    language: z.string().describe('代码片段的编程语言'),
  }),
  outputSchema: z.object({
    reviewId: z.string(),
    status: z.string(),
    comments: z.array(
      z.object({
        line: z.number(),
        message: z.string(),
        severity: z.enum(['info', 'warning', 'error']),
      }),
    ),
    overallScore: z.number(),
  }),
  execute: async (input) => {
    // 添加输入验证
    if (!input?.code) {
      return {
        reviewId: generateReviewId(),
        status: 'error',
        comments: [{
          line: 1,
          message: '代码内容不能为空',
          severity: 'error'
        }],
        overallScore: 0
      };
    }

    if (!input?.language) {
      return {
        reviewId: generateReviewId(),
        status: 'error',
        comments: [{
          line: 1,
          message: '必须指定编程语言',
          severity: 'error'
        }],
        overallScore: 0
      };
    }

    return localCodeReview(input.code, input.language);
  },
});

// 生成唯一的审查ID
const generateReviewId = () => {
  return 'review_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
};

const localCodeReview = (code: string, language: string): CodeReviewResponse => {
  try {
    // 验证输入参数
    if (typeof code !== 'string' || code.trim().length === 0) {
      return {
        reviewId: generateReviewId(),
        status: 'error',
        comments: [{
          line: 1,
          message: '代码内容不能为空',
          severity: 'error'
        }],
        overallScore: 0
      };
    }

    const codeLines = code.split('\n');
    const comments: {
      line: number;
      message: string;
      severity: 'info' | 'warning' | 'error';
    }[] = [];
    let overallScore = 10; // 初始满分

    // 检查代码行长度
    codeLines.forEach((line, index) => {
      if (line.length > 80) {
        comments.push({
          line: index + 1,
          message: '代码行长度超过80个字符，可能影响可读性',
          severity: 'warning'
        });
        overallScore -= 0.5;
      }
    });

    // 检查空函数或空代码块
    const emptyBlockRegex = /\{\s*\}/g;
    const emptyBlockMatches = code.match(emptyBlockRegex);
    if (emptyBlockMatches && emptyBlockMatches.length > 0) {
      let lineNumber = 1;
      for (let i = 0; i < codeLines.length; i++) {
        if (codeLines[i].match(emptyBlockRegex)) {
          comments.push({
            line: i + 1,
            message: '存在空代码块，建议添加有意义的实现或注释',
            severity: 'info'
          });
          lineNumber = i + 1;
          break;
        }
      }
      overallScore -= 0.5;
    }

    // 根据语言的不同进行特定检查
    switch (language.toLowerCase()) {
      case 'javascript':
      case 'typescript':
        // 检查console.log语句
        codeLines.forEach((line, index) => {
          if (line.includes('console.log')) {
            comments.push({
              line: index + 1,
              message: '生产代码中应避免使用console.log语句',
              severity: 'warning'
            });
            overallScore -= 0.5;
          }
        });

        // 检查未使用的变量声明
        if (code.includes('let') || code.includes('const') || code.includes('var')) {
          // 这里简化处理，实际中需要更复杂的分析
          comments.push({
            line: 1,
            message: '建议检查是否存在未使用的变量',
            severity: 'info'
          });
        }
        break;

      case 'python':
        // 检查python中的print语句
        codeLines.forEach((line, index) => {
          if (line.includes('print(')) {
            comments.push({
              line: index + 1,
              message: '生产代码中应避免使用print语句',
              severity: 'warning'
            });
            overallScore -= 0.5;
          }
        });
        break;
    }

    // 检查错误处理
    if (!code.includes('try') && !code.includes('catch') && !code.includes('throw')) {
      comments.push({
        line: 1,
        message: '代码中可能缺少错误处理机制',
        severity: 'warning'
      });
      overallScore -= 1;
    }

    // 查找API调用但没有错误处理的情况
    if ((code.includes('fetch(') || code.includes('axios.') || code.includes('http.')) &&
      !code.includes('catch') && !code.includes('try')) {
      comments.push({
        line: 1,
        message: 'API调用应该包含错误处理',
        severity: 'error'
      });
      overallScore -= 2;
    }

    // 确保分数在0-10之间
    overallScore = Math.max(0, Math.min(10, overallScore));

    // 如果分数高但没有任何评论，添加一个积极的评论
    if (overallScore > 8 && comments.length === 0) {
      comments.push({
        line: 1,
        message: '代码结构良好，没有发现明显问题',
        severity: 'info'
      });
    }

    return {
      reviewId: generateReviewId(),
      status: comments.some(c => c.severity === 'error') ? 'failed' : 'passed',
      comments,
      overallScore: parseFloat(overallScore.toFixed(1))
    };
  } catch (error) {
    return {
      reviewId: generateReviewId(),
      status: 'error',
      comments: [{
        line: 1,
        message: '代码审查过程中发生错误',
        severity: 'error'
      }],
      overallScore: 0
    };
  }
};
