export async function POST(req: Request) {
    const body = await req.json();

    const query = body.query;

    // fake response for now
    return Response.json({
        products: [
            { name: "Sample Product 1", price: "LKR 1000" },
            { name: "Sample Product 2", price: "LKR 2000" },
        ],
    });
}