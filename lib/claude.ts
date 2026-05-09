import Anthropic from '@anthropic-ai/sdk';

let _claude: Anthropic | null = null;

export function getClaude(): Anthropic {
  if (!_claude) {
    _claude = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
      timeout: 60_000,
      maxRetries: 2,
    });
  }
  return _claude;
}
