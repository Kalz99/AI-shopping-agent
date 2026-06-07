import { searchProducts, getProduct } from "@/lib/kapruka";

export async function POST(req: Request) {
    try {
        const { action, payload } = await req.json();

        if (action === "search") {
            const data = await searchProducts(payload.query);
            
            // Map Kapruka schema to the format expected by the frontend
            const results = data?.results || [];
            const products = results.map((item: any) => ({
                product_id: item.id,
                name: item.name,
                price: item.price ? `${item.price.currency} ${item.price.amount}` : "N/A",
                image: item.image_url,
            }));

            return Response.json({ products });
        }

        return Response.json({ error: "Invalid action" });
    } catch (err) {
        console.error(err);
        return Response.json(
            { error: "Server error" },
            { status: 500 }
        );
    }
}