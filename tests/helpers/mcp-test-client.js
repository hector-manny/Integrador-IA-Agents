import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

/**
 * @param {() => import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} createServerFn
 * @param {(client: Client) => Promise<void>} fn
 */
export async function withMcpClient(createServerFn, fn) {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createServerFn();
  const client = new Client({ name: 'test-client', version: '0.1.0' });

  await server.connect(serverTransport);
  await client.connect(clientTransport);

  try {
    await fn(client);
  } finally {
    await client.close();
    await server.close();
  }
}

/**
 * @param {import('@modelcontextprotocol/sdk/types.js').CallToolResult} result
 */
export function parseMcpToolJson(result) {
  const text = result.content?.[0];
  if (!text || text.type !== 'text' || typeof text.text !== 'string') {
    throw new Error('Expected MCP text content');
  }
  return JSON.parse(text.text);
}
