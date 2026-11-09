import { MCP_ENDPOINT, MCP_METADATA_ENDPOINT } from './constants';

type Fetch = typeof fetch;

interface ProtectedResourceMetadata {
  authorization_servers?: unknown;
  resource?: unknown;
  resource_name?: unknown;
}

export interface McpServiceHealth {
  authorizationServer: string;
  resource: string;
  resourceName: string;
}

export async function checkMcpService(fetcher: Fetch = fetch): Promise<McpServiceHealth> {
  const response = await fetcher(MCP_METADATA_ENDPOINT, {
    headers: {
      Accept: 'application/json'
    },
    signal: AbortSignal.timeout(10_000)
  });

  if (!response.ok) {
    throw new Error(`metadata endpoint returned HTTP ${response.status}`);
  }

  const metadata = (await response.json()) as ProtectedResourceMetadata;
  const authorizationServers = Array.isArray(metadata.authorization_servers)
    ? metadata.authorization_servers.filter((value): value is string => typeof value === 'string')
    : [];

  if (metadata.resource !== MCP_ENDPOINT) {
    throw new Error('metadata identifies an unexpected protected resource');
  }

  const authorizationServer = authorizationServers[0];
  if (!authorizationServer) {
    throw new Error('metadata does not advertise an authorization server');
  }

  return {
    authorizationServer,
    resource: metadata.resource,
    resourceName: typeof metadata.resource_name === 'string' ? metadata.resource_name : 'Inttegro'
  };
}
