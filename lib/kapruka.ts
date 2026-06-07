import { callMCP } from "./mcp";


export async function searchProducts(query: string) {
    return callMCP("kapruka_search_products", {
        params: {
            q: query,
            limit: 50,
            in_stock_only: true,
            response_format: "json"
        }
    });
}
export async function getProduct(product_id: string) {
    return callMCP("kapruka_get_product", {
        params: {
            product_id,
            currency: "LKR",
            response_format: "json"
        }
    });
}

export async function getCategories() {
    return callMCP("kapruka_list_categories", {
        params: {
            response_format: "json"
        }
    });
}

export async function checkDelivery(city: string, date: string, product_id: string) {
    return callMCP("kapruka_check_delivery", {
        params: {
            city,
            delivery_date: date,
            product_id,
            response_format: "json"
        }
    });
}

export async function createOrder(cart: any) {
    return callMCP("kapruka_create_order", {
        params: {
            ...cart,
            currency: "LKR",
            response_format: "json"
        }
    });
}