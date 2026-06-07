import { callMCP } from "./mcp";

export async function searchProducts(query: string) {
    const data = await callMCP("search_products", {
        query,
    });

    return data;
}