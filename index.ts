#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import chalk from 'chalk';
import OpenAI from 'openai';

interface ConsensusData {
  problem: string;
  availableTools: string[];
  maxRounds: number;
  consensusThreshold: number;
}

interface AdvisorConfig {
  id: string;
  name: string;
  systemPrompt: string;
  model: string;
}

interface AdvisorResponse {
  advisorId: string;
  response: string;
  toolRequests?: ToolRequest[];
}

interface ToolRequest {
  tool: string;
  parameters: Record<string, any>;
  reason: string;
}

interface DiscussionRound {
  round: number;
  responses: AdvisorResponse[];
  consensus?: string;
}

class ConsensusServer {
  private openai: OpenAI;
  private discussionHistory: DiscussionRound[] = [];
  private readonly disableLogging: boolean;
  private readonly preConfiguredAdvisors: AdvisorConfig[];

  constructor() {
    this.disableLogging = (process.env.DISABLE_CONSENSUS_LOGGING || "").toLowerCase() === "true";
    
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY environment variable is required');
    }
    
    this.openai = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://github.com/dakraid/mcp-consensus',
        'X-Title': 'MCP Consensus Server'
      }
    });

    this.preConfiguredAdvisors = [
      {
        id: 'advisor_alpha',
        name: 'Advisor Alpha',
        systemPrompt: `You are an AI advisor participating in a consensus system. Your primary goal is to contribute to finding the objectively best solution through collaborative discussion with other advisors.

Core Principles:
1. **Objectivity**: Base your analysis on facts, evidence, and logical reasoning
2. **Collaboration**: Work constructively with other advisors to reach consensus
3. **Thoroughness**: Consider problems from multiple angles and dimensions
4. **Adaptability**: Be willing to revise your position based on compelling arguments
5. **Clarity**: Express your reasoning clearly and provide well-justified conclusions

Your Role:
- Analyze the problem comprehensively using whatever perspectives are most relevant
- Consider technical, practical, strategic, ethical, and risk dimensions as appropriate
- Engage respectfully with other advisors' viewpoints
- Request additional information when needed through the tool request system
- Work toward consensus while maintaining intellectual honesty

Discussion Guidelines:
- Start with your initial analysis and proposed solution
- Consider other advisors' perspectives thoughtfully
- Revise your position when presented with strong evidence or reasoning
- Help the group identify blind spots or overlooked considerations
- Focus on finding the optimal solution rather than winning arguments

Remember that you are part of a team working toward the same goal: finding the objectively best solution to the problem at hand.`,
        model: 'moonshotai/kimi-k2'
      },
      {
        id: 'advisor_beta',
        name: 'Advisor Beta',
        systemPrompt: `You are an AI advisor participating in a consensus system. Your primary goal is to contribute to finding the objectively best solution through collaborative discussion with other advisors.

Core Principles:
1. **Objectivity**: Base your analysis on facts, evidence, and logical reasoning
2. **Collaboration**: Work constructively with other advisors to reach consensus
3. **Thoroughness**: Consider problems from multiple angles and dimensions
4. **Adaptability**: Be willing to revise your position based on compelling arguments
5. **Clarity**: Express your reasoning clearly and provide well-justified conclusions

Your Role:
- Analyze the problem comprehensively using whatever perspectives are most relevant
- Consider technical, practical, strategic, ethical, and risk dimensions as appropriate
- Engage respectfully with other advisors' viewpoints
- Request additional information when needed through the tool request system
- Work toward consensus while maintaining intellectual honesty

Discussion Guidelines:
- Start with your initial analysis and proposed solution
- Consider other advisors' perspectives thoughtfully
- Revise your position when presented with strong evidence or reasoning
- Help the group identify blind spots or overlooked considerations
- Focus on finding the optimal solution rather than winning arguments

Remember that you are part of a team working toward the same goal: finding the objectively best solution to the problem at hand.`,
        model: 'deepseek/deepseek-chat-v3-0324'
      },
      {
        id: 'advisor_gamma',
        name: 'Advisor Gamma',
        systemPrompt: `You are an AI advisor participating in a consensus system. Your primary goal is to contribute to finding the objectively best solution through collaborative discussion with other advisors.

Core Principles:
1. **Objectivity**: Base your analysis on facts, evidence, and logical reasoning
2. **Collaboration**: Work constructively with other advisors to reach consensus
3. **Thoroughness**: Consider problems from multiple angles and dimensions
4. **Adaptability**: Be willing to revise your position based on compelling arguments
5. **Clarity**: Express your reasoning clearly and provide well-justified conclusions

Your Role:
- Analyze the problem comprehensively using whatever perspectives are most relevant
- Consider technical, practical, strategic, ethical, and risk dimensions as appropriate
- Engage respectfully with other advisors' viewpoints
- Request additional information when needed through the tool request system
- Work toward consensus while maintaining intellectual honesty

Discussion Guidelines:
- Start with your initial analysis and proposed solution
- Consider other advisors' perspectives thoughtfully
- Revise your position when presented with strong evidence or reasoning
- Help the group identify blind spots or overlooked considerations
- Focus on finding the optimal solution rather than winning arguments

Remember that you are part of a team working toward the same goal: finding the objectively best solution to the problem at hand.`,
        model: 'z-ai/glm-4.5'
      },
      {
        id: 'advisor_delta',
        name: 'Advisor Delta',
        systemPrompt: `You are an AI advisor participating in a consensus system. Your primary goal is to contribute to finding the objectively best solution through collaborative discussion with other advisors.

Core Principles:
1. **Objectivity**: Base your analysis on facts, evidence, and logical reasoning
2. **Collaboration**: Work constructively with other advisors to reach consensus
3. **Thoroughness**: Consider problems from multiple angles and dimensions
4. **Adaptability**: Be willing to revise your position based on compelling arguments
5. **Clarity**: Express your reasoning clearly and provide well-justified conclusions

Your Role:
- Analyze the problem comprehensively using whatever perspectives are most relevant
- Consider technical, practical, strategic, ethical, and risk dimensions as appropriate
- Engage respectfully with other advisors' viewpoints
- Request additional information when needed through the tool request system
- Work toward consensus while maintaining intellectual honesty

Discussion Guidelines:
- Start with your initial analysis and proposed solution
- Consider other advisors' perspectives thoughtfully
- Revise your position when presented with strong evidence or reasoning
- Help the group identify blind spots or overlooked considerations
- Focus on finding the optimal solution rather than winning arguments

Remember that you are part of a team working toward the same goal: finding the objectively best solution to the problem at hand.`,
        model: 'openai/gpt-4.1'
      },
      {
        id: 'advisor_epsilon',
        name: 'Advisor Epsilon',
        systemPrompt: `You are an AI advisor participating in a consensus system. Your primary goal is to contribute to finding the objectively best solution through collaborative discussion with other advisors.

Core Principles:
1. **Objectivity**: Base your analysis on facts, evidence, and logical reasoning
2. **Collaboration**: Work constructively with other advisors to reach consensus
3. **Thoroughness**: Consider problems from multiple angles and dimensions
4. **Adaptability**: Be willing to revise your position based on compelling arguments
5. **Clarity**: Express your reasoning clearly and provide well-justified conclusions

Your Role:
- Analyze the problem comprehensively using whatever perspectives are most relevant
- Consider technical, practical, strategic, ethical, and risk dimensions as appropriate
- Engage respectfully with other advisors' viewpoints
- Request additional information when needed through the tool request system
- Work toward consensus while maintaining intellectual honesty

Discussion Guidelines:
- Start with your initial analysis and proposed solution
- Consider other advisors' perspectives thoughtfully
- Revise your position when presented with strong evidence or reasoning
- Help the group identify blind spots or overlooked considerations
- Focus on finding the optimal solution rather than winning arguments

Remember that you are part of a team working toward the same goal: finding the objectively best solution to the problem at hand.`,
        model: 'anthropic/claude-sonnet-4'
      }
    ];
  }

  private validateConsensusData(input: unknown): ConsensusData {
    const data = input as Record<string, unknown>;

    if (!data.problem || typeof data.problem !== 'string') {
      throw new Error('Invalid problem: must be a string');
    }
    if (!data.availableTools || !Array.isArray(data.availableTools)) {
      throw new Error('Invalid availableTools: must be an array');
    }
    if (!data.maxRounds || typeof data.maxRounds !== 'number' || data.maxRounds < 1) {
      throw new Error('Invalid maxRounds: must be a number >= 1');
    }
    if (!data.consensusThreshold || typeof data.consensusThreshold !== 'number' || 
        data.consensusThreshold < 0 || data.consensusThreshold > 1) {
      throw new Error('Invalid consensusThreshold: must be a number between 0 and 1');
    }

    return {
      problem: data.problem,
      availableTools: data.availableTools,
      maxRounds: data.maxRounds,
      consensusThreshold: data.consensusThreshold
    };
  }

  private async queryAdvisor(advisor: AdvisorConfig, prompt: string, context?: string): Promise<string> {
    const messages: any[] = [
      { role: 'system', content: advisor.systemPrompt }
    ];

    if (context) {
      messages.push({ role: 'user', content: context });
    }

    messages.push({ role: 'user', content: prompt });

    const completion = await this.openai.chat.completions.create({
      model: advisor.model,
      messages,
      temperature: 0.7,
      max_completion_tokens: 2000
    });

    return completion.choices[0]?.message?.content || 'No response received';
  }

  private parseToolRequests(response: string): ToolRequest[] {
    const toolRequests: ToolRequest[] = [];
    const toolRegex = /TOOL_REQUEST:\s*{\s*"tool":\s*"([^"]+)"\s*,\s*"parameters":\s*({[^}]+})\s*,\s*"reason":\s*"([^"]+)"\s*}/g;
    let match;

    while ((match = toolRegex.exec(response)) !== null) {
      try {
        toolRequests.push({
          tool: match[1],
          parameters: JSON.parse(match[2]),
          reason: match[3]
        });
      } catch (e) {
        console.warn(`Failed to parse tool request: ${match[0]}`);
      }
    }

    return toolRequests;
  }

  private checkConsensus(responses: AdvisorResponse[], threshold: number): { hasConsensus: boolean; consensus?: string } {
    if (responses.length < 2) {
      return { hasConsensus: false };
    }

    const responseTexts = responses.map(r => r.response.toLowerCase().trim());
    const uniqueResponses = [...new Set(responseTexts)];
    
    if (uniqueResponses.length === 1) {
      return { hasConsensus: true, consensus: responses[0].response };
    }

    const agreementCounts = responseTexts.reduce((acc, response) => {
      acc[response] = (acc[response] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const maxAgreement = Math.max(...Object.values(agreementCounts));
    const agreementRatio = maxAgreement / responses.length;

    if (agreementRatio >= threshold) {
      const consensusResponse = responses.find(r => r.response.toLowerCase().trim() === 
        Object.keys(agreementCounts).find(key => agreementCounts[key] === maxAgreement));
      return { hasConsensus: true, consensus: consensusResponse?.response };
    }

    return { hasConsensus: false };
  }

  private formatDiscussionRound(round: DiscussionRound): string {
    let output = chalk.cyan(`\n🤔 Round ${round.round} Discussion:\n`);
    output += chalk.gray('─'.repeat(50) + '\n');

    for (const response of round.responses) {
      const advisor = response.advisorId;
      output += chalk.green(`\n📝 Advisor ${advisor}:\n`);
      output += `${response.response}\n`;
      
      if (response.toolRequests && response.toolRequests.length > 0) {
        output += chalk.yellow(`\n🔧 Tool Requests:\n`);
        for (const toolReq of response.toolRequests) {
          output += `  - ${toolReq.tool}: ${toolReq.reason}\n`;
        }
      }
    }

    if (round.consensus) {
      output += chalk.magenta(`\n✅ CONSENSUS REACHED:\n`);
      output += `${round.consensus}\n`;
    }

    return output;
  }

  public async processConsensus(input: unknown): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
    try {
      const validatedInput = this.validateConsensusData(input);
      this.discussionHistory = [];

      let round = 1;
      let currentContext = validatedInput.problem;
      let finalConsensus: string | undefined;

      if (!this.disableLogging) {
        console.error(chalk.blue('\n🚀 Starting Consensus Process\n'));
        console.error(chalk.gray('─'.repeat(50)));
        console.error(`Problem: ${validatedInput.problem}`);
        console.error(`Advisors: ${this.preConfiguredAdvisors.map(a => a.name).join(', ')}`);
        console.error(`Max Rounds: ${validatedInput.maxRounds}`);
        console.error(chalk.gray('─'.repeat(50)));
      }

      while (round <= validatedInput.maxRounds && !finalConsensus) {
        const responses: AdvisorResponse[] = [];
        const allToolRequests: ToolRequest[] = [];

        const initialPrompt = round === 1 ? 
          `PROBLEM TO SOLVE:\n${validatedInput.problem}\n\nAVAILABLE TOOLS:\n${validatedInput.availableTools.join(', ')}\n\nPlease provide your analysis and solution. If you need additional information, use the TOOL_REQUEST format.\n\nTOOL_REQUEST format example:\nTOOL_REQUEST: {"tool": "web_search", "parameters": {"query": "specific search query"}, "reason": "I need to research current information about this topic"}` :
          `PREVIOUS DISCUSSION CONTEXT:\n${currentContext}\n\nPlease review the previous discussion and provide your updated analysis. Consider other advisors' perspectives and work toward consensus. If you need additional information, use the TOOL_REQUEST format.`;

        for (const advisor of this.preConfiguredAdvisors) {
          if (!this.disableLogging) {
            console.error(chalk.yellow(`\n💭 Querying ${advisor.name}...`));
          }

          const response = await this.queryAdvisor(advisor, initialPrompt);
          const toolRequests = this.parseToolRequests(response);

          responses.push({
            advisorId: advisor.id,
            response,
            toolRequests: toolRequests.length > 0 ? toolRequests : undefined
          });

          allToolRequests.push(...toolRequests);
        }

        const consensusResult = this.checkConsensus(responses, validatedInput.consensusThreshold);
        
        const discussionRound: DiscussionRound = {
          round,
          responses,
          consensus: consensusResult.consensus
        };

        this.discussionHistory.push(discussionRound);

        if (!this.disableLogging) {
          const formattedRound = this.formatDiscussionRound(discussionRound);
          console.error(formattedRound);
        }

        if (consensusResult.hasConsensus) {
          finalConsensus = consensusResult.consensus;
          break;
        }

        if (allToolRequests.length > 0) {
          if (!this.disableLogging) {
            console.error(chalk.red(`\n⚠️  Advisors requested ${allToolRequests.length} tool(s). Please execute these tools and continue the discussion.`));
          }
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                status: 'tool_requests_needed',
                round,
                toolRequests: allToolRequests,
                discussionSummary: this.generateDiscussionSummary(),
                nextAction: 'Please execute the requested tools and continue the consensus process'
              }, null, 2)
            }]
          };
        }

        currentContext = this.generateDiscussionContext();
        round++;
      }

      const result = {
        status: finalConsensus ? 'consensus_reached' : 'max_rounds_reached',
        finalConsensus: finalConsensus || 'No consensus reached within the maximum number of rounds',
        totalRounds: this.discussionHistory.length,
        discussionHistory: this.discussionHistory
      };

      if (!this.disableLogging) {
        console.error(chalk.blue('\n🎯 Consensus Process Complete\n'));
        console.error(chalk.gray('─'.repeat(50)));
        console.error(`Status: ${result.status}`);
        if (finalConsensus) {
          console.error(chalk.green(`Final Consensus: ${finalConsensus}`));
        }
        console.error(chalk.gray('─'.repeat(50)));
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify(result, null, 2)
        }]
      };

    } catch (error) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
            status: 'failed'
          }, null, 2)
        }],
        isError: true
      };
    }
  }

  private generateDiscussionContext(): string {
    let context = 'Previous Discussion Summary:\n\n';
    
    for (const round of this.discussionHistory) {
      context += `Round ${round.round}:\n`;
      for (const response of round.responses) {
        context += `- Advisor ${response.advisorId}: ${response.response.substring(0, 200)}...\n`;
      }
      context += '\n';
    }
    
    return context;
  }

  private generateDiscussionSummary(): string {
    const summary = {
      totalRounds: this.discussionHistory.length,
      participants: this.discussionHistory[0]?.responses.map(r => r.advisorId) || [],
      keyPoints: this.discussionHistory.flatMap(round => 
        round.responses.map(response => ({
          advisor: response.advisorId,
          point: response.response.substring(0, 150)
        }))
      )
    };
    
    return JSON.stringify(summary, null, 2);
  }
}

const CONSENSUS_TOOL: Tool = {
  name: "consensus",
  description: `A multi-advisor consensus system that facilitates structured discussion and debate among general-purpose AI advisors to reach optimal solutions.

This tool uses a team of 5 general-purpose AI advisors (Alpha, Beta, Gamma, Delta, Epsilon) who are trained to:
- Analyze any type of problem from multiple relevant perspectives
- Consider technical, practical, strategic, ethical, and risk dimensions as appropriate
- Work collaboratively toward consensus through objective analysis
- Adapt their approach based on the specific problem domain
- Request additional information when needed to make informed decisions

Each advisor follows core principles of objectivity, collaboration, thoroughness, adaptability, and clarity, making them suitable for any problem type without being bound to specific roles.

The advisors work collaboratively to:
1. Analyze problems comprehensively from whatever angles are most relevant
2. Engage in constructive debate and evidence-based discussion
3. Request additional information through tools when needed
4. Work toward consensus on the objectively best solution
5. Provide well-reasoned justification for their conclusions

When to use this tool:
- Any complex problem that would benefit from multiple perspectives
- Decisions requiring thorough analysis and debate
- Problems where objective consensus is valuable
- Situations where different dimensions need to be considered
- Scenarios requiring comprehensive evaluation and risk assessment
- Any decision where you want to validate through multiple AI perspectives

Key features:
- 5 general-purpose advisors adaptable to any problem domain
- Multi-round discussion with automatic consensus detection
- Tool request integration for research and information gathering
- Configurable discussion limits and consensus thresholds
- Detailed discussion history and reasoning documentation
- Advisors consider all relevant dimensions without role limitations

Parameters explained:
- problem: Detailed description of the problem or request to solve
- availableTools: Array of tool names available to the LLM for research
- maxRounds: Maximum number of discussion rounds (default: 5, max: 10)
- consensusThreshold: Consensus agreement threshold (default: 0.8, range: 0.0-1.0)

Tool request format for advisors:
TOOL_REQUEST: {"tool": "tool_name", "parameters": {"param": "value"}, "reason": "explanation of why this tool is needed"}

The system will:
1. Present the problem to all 5 general-purpose advisors simultaneously
2. Collect initial responses and any tool requests
3. If tools are requested, pause for LLM execution and continue with results
4. Facilitate multiple discussion rounds until consensus or max rounds reached
5. Return final consensus solution with complete discussion history

Example usage scenarios:
- Business decisions requiring comprehensive analysis
- Technical problems with multiple possible solutions
- Strategic planning with various considerations
- Ethical dilemmas needing balanced evaluation
- Any complex problem where multiple perspectives would be beneficial`,
  inputSchema: {
    type: "object",
    properties: {
      problem: {
        type: "string",
        description: "Detailed description of the problem or request to solve"
      },
      availableTools: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Array of tool names available to the LLM for research"
      },
      maxRounds: {
        type: "integer",
        description: "Maximum number of discussion rounds",
        default: 5,
        minimum: 1,
        maximum: 10
      },
      consensusThreshold: {
        type: "number",
        description: "Agreement threshold for consensus (0.0-1.0)",
        default: 0.8,
        minimum: 0.0,
        maximum: 1.0
      }
    },
    required: ["problem", "availableTools"]
  }
};

const server = new Server(
  {
    name: "consensus-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const consensusServer = new ConsensusServer();

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [CONSENSUS_TOOL],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "consensus") {
    return await consensusServer.processConsensus(request.params.arguments);
  }

  return {
    content: [{
      type: "text",
      text: `Unknown tool: ${request.params.name}`
    }],
    isError: true
  };
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Consensus MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
