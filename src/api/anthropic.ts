import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { RequestScheduler } from '../scheduler/RequestScheduler';
import { getLogger } from '../logger';
import { ChatMessage } from '../types';

function anthropicContentToText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((b: any) => {
        if (typeof b === 'string') return b;
        if (b?.type === 'text' && typeof b.text === 'string') return b.text;
        if (b?.type === 'image') return '[image]';
        return '';
      })
      .join('');
  }
  return String(content ?? '');
}

function toChatMessages(anthropicMessages: any[], system: unknown): ChatMessage[] {
  const out: ChatMessage[] = [];
  const sysText = anthropicContentToText(system);
  if (sysText) out.push({ role: 'system', content: sysText });
  for (const m of anthropicMessages || []) {
    const role = m.role === 'assistant' ? 'assistant' : 'user';
    const text = anthropicContentToText(m.content);
    out.push({ role, content: text });
  }
  return out;
}

export function createAnthropicRouter(requestScheduler: RequestScheduler): Router {
  const router = Router();
  const log = getLogger();

  router.post('/messages', async (req: Request, res: Response) => {
    try {
      const {
        model,
        messages,
        system,
        max_tokens,
        maxTokens,
        temperature,
        stream,
        stop_sequences,
      } = req.body ?? {};

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        res.status(400).json({
          type: 'error',
          error: { type: 'invalid_request_error', message: 'messages is required and must be a non-empty array' },
        });
        return;
      }

      const modelId = model || 'claude-sonnet-5';
      const chatMessages = toChatMessages(messages, system);
      const prompt = chatMessages.map(m => `${m.role}: ${m.content}`).join('\n');
      const maxTok = max_tokens ?? maxTokens;

      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');

        const msgId = `msg_${uuidv4().replace(/-/g, '')}`;
        const result = await requestScheduler.submitRequest({
          model: modelId,
          prompt,
          messages: chatMessages,
          maxTokens: maxTok,
          temperature,
        });

        const content = result.success ? (result.response || '') : '';

        res.write(`event: message_start\n`);
        res.write(`data: ${JSON.stringify({ type: 'message_start', message: { id: msgId, type: 'message', role: 'assistant', content: [], model: modelId, stop_reason: null, stop_sequence: null, usage: { input_tokens: 0, output_tokens: 0 } } })}\n\n`);

        res.write(`event: content_block_start\n`);
        res.write(`data: ${JSON.stringify({ type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } })}\n\n`);

        const words = content.split(/(\s+)/);
        for (const w of words) {
          if (!w) continue;
          res.write(`event: content_block_delta\n`);
          res.write(`data: ${JSON.stringify({ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: w } })}\n\n`);
        }

        res.write(`event: content_block_stop\n`);
        res.write(`data: ${JSON.stringify({ type: 'content_block_stop', index: 0 })}\n\n`);

        const stopReason = result.success ? 'end_turn' : 'error';
        res.write(`event: message_delta\n`);
        res.write(`data: ${JSON.stringify({ type: 'message_delta', delta: { stop_reason: stopReason, stop_sequence: stop_sequences?.[0] ?? null }, usage: { output_tokens: Math.ceil(content.length / 4) } })}\n\n`);

        res.write(`event: message_stop\n`);
        res.write(`data: ${JSON.stringify({ type: 'message_stop' })}\n\n`);
        res.end();
        return;
      }

      const result = await requestScheduler.submitRequest({
        model: modelId,
        prompt,
        messages: chatMessages,
        maxTokens: maxTok,
        temperature,
      });

      if (!result.success) {
        res.status(502).json({
          type: 'error',
          error: { type: 'api_error', message: result.error || 'Request failed' },
        });
        return;
      }

      const text = result.response || '';
      const msgId = `msg_${uuidv4().replace(/-/g, '')}`;

      res.json({
        id: msgId,
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text }],
        model: modelId,
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: {
          input_tokens: 0,
          output_tokens: Math.ceil(text.length / 4),
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error('Anthropic', 'messages failed', { error: msg });
      res.status(500).json({ type: 'error', error: { type: 'api_error', message: msg } });
    }
  });

  router.post('/complete', async (req: Request, res: Response) => {
    try {
      const { model, prompt, max_tokens_to_sample, temperature, stream } = req.body ?? {};
      if (!prompt || typeof prompt !== 'string') {
        res.status(400).json({ type: 'error', error: { type: 'invalid_request_error', message: 'prompt is required' } });
        return;
      }
      const modelId = model || 'claude-sonnet-5';
      const result = await requestScheduler.submitRequest({
        model: modelId,
        prompt,
        messages: [{ role: 'user', content: prompt }],
        maxTokens: max_tokens_to_sample,
        temperature,
        stream: !!stream,
      });
      if (!result.success) {
        res.status(502).json({ type: 'error', error: { type: 'api_error', message: result.error || 'failed' } });
        return;
      }
      res.json({
        id: `cmpl_${uuidv4().replace(/-/g, '')}`,
        type: 'completion',
        completion: result.response || '',
        stop_reason: 'stop_sequence',
        model: modelId,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error('Anthropic', 'complete failed', { error: msg });
      res.status(500).json({ type: 'error', error: { type: 'api_error', message: msg } });
    }
  });

  return router;
}
