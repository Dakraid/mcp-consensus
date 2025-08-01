# MCP Consensus Server

A Model Context Protocol (MCP) server that implements an advisor-based consensus mechanism for collaborative problem-solving using multiple AI models.

## Features

- **Multi-Advisor Consensus System**: Engages 5 specialized AI advisors in structured discussion
- **Collaborative Problem-Solving**: Advisors work together to find optimal solutions through debate and analysis
- **Tool Integration**: Advisors can request additional information through available tools
- **Configurable Discussion Parameters**: Adjustable rounds and consensus thresholds
- **Real-time Discussion Logging**: Colorful console output showing the consensus process
- **Multiple AI Models**: Utilizes different models (OpenAI, Anthropic, DeepSeek, Moonshot, Z-AI) for diverse perspectives

## Installation

```bash
npm install @dakraid/mcp-consensus
```

## Prerequisites

- Node.js 18+
- OpenRouter API key (set as `OPENROUTER_API_KEY` environment variable)

## Usage

### MCP Server Configuration

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "consensus": {
      "command": "npx",
      "args": [
        "-y",
        "@dakraid/mcp-consensus"
      ],
      "env": {
        "OPENROUTER_API_KEY": "",
        "CONSENSUS_MAX_ROUNDS": "5",
        "CONSENSUS_THRESHOLD": "0.8"
      }
    }
  }
}
```

### Available Tools

#### `consensus`

A multi-advisor consensus system that facilitates structured discussion and debate among general-purpose AI advisors to reach optimal solutions.

**Parameters:**
- `problem` (required): Detailed description of the problem to solve
- `availableTools` (required): Array of tool names available for research

**Example Usage:**

```javascript
// Basic consensus
{
  "problem": "Should we adopt a remote-first work policy for our tech company?",
  "availableTools": ["web_search", "read_file"]
}
```

## How It Works

1. **Problem Presentation**: The problem is presented to all 5 advisors simultaneously
2. **Initial Analysis**: Each advisor provides their analysis and proposed solution
3. **Tool Requests**: Advisors can request additional information through available tools
4. **Multi-Round Discussion**: Advisors engage in structured debate, considering each other's perspectives
5. **Consensus Detection**: The system monitors for agreement based on the configured threshold
6. **Result Delivery**: Returns the final consensus with complete discussion history

## Advisors

The system includes 5 pre-configured advisors, each using different AI models:

- **Advisor Alpha**: Moonshot AI Kimi-k2
- **Advisor Beta**: DeepSeek Chat v3
- **Advisor Gamma**: Z-AI GLM-4.5
- **Advisor Delta**: OpenAI GPT-4.1
- **Advisor Epsilon**: Anthropic Claude Sonnet 4

Each advisor follows core principles of objectivity, collaboration, thoroughness, adaptability, and clarity.

## Tool Request Format

Advisors can request additional information using this format:

```
TOOL_REQUEST: {"tool": "web_search", "parameters": {"query": "remote work productivity statistics"}, "reason": "I need current data on remote work effectiveness"}
```

## Response Structure

The consensus tool returns:

```json
{
  "status": "consensus_reached" | "max_rounds_reached" | "tool_requests_needed",
  "finalConsensus": "The agreed-upon solution",
  "totalRounds": 3,
  "discussionHistory": [...]
}
```

## Development

```bash
# Clone the repository
git clone https://github.com/dakraid/mcp-consensus.git
cd mcp-consensus

# Install dependencies
npm install

# Build the project
npm run build

# Watch for changes
npm run watch
```

## Configuration

### Environment Variables

- `OPENROUTER_API_KEY`: Required API key for OpenRouter
- `CONSENSUS_MAX_ROUNDS`: Maximum number of discussion rounds (default: 5, range: 1-10)
- `CONSENSUS_THRESHOLD`: Agreement threshold for consensus detection (default: 0.8, range: 0.0-1.0)
- `DISABLE_CONSENSUS_LOGGING`: Set to "true" to disable console logging (default: false)

### Customization

You can modify the advisor configurations in `index.ts` to:
- Change system prompts
- Use different AI models
- Add or remove advisors
- Adjust model parameters

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions, please visit the [GitHub Issues](https://github.com/dakraid/mcp-consensus/issues) page.

## Author

Created by [@dakraid](https://github.com/dakraid)