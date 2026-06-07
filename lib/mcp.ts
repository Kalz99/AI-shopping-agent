const MCP_URL = "https://mcp.kapruka.com/mcp";

let requestId = 1;
let activeSessionId: string | null = null;
let activeSseController: AbortController | null = null;

async function ensureSession() {
    if (activeSessionId) return activeSessionId;

    console.log("[MCP] Initializing new session with Kapruka MCP...");
    const initialRes = await fetch(MCP_URL, {
        method: "GET",
        headers: {
            "Accept": "application/json, text/event-stream"
        }
    });

    const sessionId = initialRes.headers.get("mcp-session-id");
    if (!sessionId) {
        throw new Error("Failed to retrieve mcp-session-id from Kapruka MCP");
    }

    activeSessionId = sessionId;

    // Establish the background SSE connection to keep session active
    const abortController = new AbortController();
    activeSseController = abortController;

    fetch(MCP_URL, {
        method: "GET",
        headers: {
            "Accept": "application/json, text/event-stream",
            "mcp-session-id": sessionId
        },
        signal: abortController.signal
    }).then(async (res) => {
        const reader = res.body?.getReader();
        if (reader) {
            try {
                while (true) {
                    const { done } = await reader.read();
                    if (done) break;
                }
            } catch (err) {
                // Connection closed or aborted
            } finally {
                reader.releaseLock();
            }
        }
    }).catch(() => {});

    // Wait a brief moment to ensure connection is registered on the server
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Initialize the MCP protocol
    const initPayload = {
        jsonrpc: "2.0",
        id: requestId++,
        method: "initialize",
        params: {
            protocolVersion: "2024-11-05",
            capabilities: {},
            clientInfo: {
                name: "Kapruka-AI-Agent",
                version: "1.0.0"
            }
        }
    };

    const initRes = await fetch(MCP_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
            "mcp-session-id": sessionId
        },
        body: JSON.stringify(initPayload)
    });
    await initRes.text(); // Consume initialization response

    return sessionId;
}

export async function callMCP(toolName: string, args: any) {
    const sessionId = await ensureSession();

    const payload = {
        jsonrpc: "2.0",
        id: requestId++,
        method: "tools/call",
        params: {
            name: toolName,
            arguments: args
        }
    };

    const res = await fetch(MCP_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
            "mcp-session-id": sessionId,
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const errText = await res.text().catch(() => "");
        // If session expired, reset session and retry once
        if (res.status === 404 || res.status === 401) {
            console.log("[MCP] Session expired. Resetting session and retrying...");
            activeSessionId = null;
            if (activeSseController) {
                activeSseController.abort();
            }
            return callMCP(toolName, args);
        }
        throw new Error(`MCP HTTP error: ${res.status} ${res.statusText} - ${errText}`);
    }

    const responseText = await res.text();
    let responseData: any;

    if (responseText.includes("data:")) {
        const lines = responseText.split("\n");
        const dataLine = lines.find(line => line.trim().startsWith("data:"));
        if (dataLine) {
            const jsonStr = dataLine.replace(/^\s*data:\s*/, "").trim();
            responseData = JSON.parse(jsonStr);
        } else {
            throw new Error(`Failed to parse SSE data line from response: ${responseText}`);
        }
    } else {
        responseData = JSON.parse(responseText);
    }

    if (responseData.error) {
        throw new Error(`MCP JSON-RPC Error: ${responseData.error.message || JSON.stringify(responseData.error)}`);
    }

    const result = responseData.result;
    if (result && result.content && Array.isArray(result.content)) {
        const textContent = result.content.find((c: any) => c.type === "text");
        if (textContent) {
            try {
                return JSON.parse(textContent.text);
            } catch {
                return textContent.text;
            }
        }
    }

    return result || responseData;
}