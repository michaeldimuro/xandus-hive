const MODEL_NAMES: Record<string, string> = {
  'MiniMax-M2.5': 'MiniMax M2.5',
  'MiniMax-M2.5-highspeed': 'MiniMax M2.5 Lightning',
  'claude-opus-4-6': 'Opus 4.6',
  'claude-sonnet-4-6': 'Sonnet 4.6',
  'claude-haiku-4-5-20251001': 'Haiku 4.5',
  // Legacy shorthand aliases
  'sonnet': 'Sonnet',
  'opus': 'Opus',
  'haiku': 'Haiku',
};

export function modelDisplayName(modelId: string): string {
  return MODEL_NAMES[modelId] || modelId;
}
