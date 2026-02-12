export async function onRequest(context) {
  try {
    const NOTION_KEY = context.env.NOTION_KEY;
    const DATABASE_ID = context.env.NOTION_DATABASE_ID;

    if (!NOTION_KEY || !DATABASE_ID) {
      return new Response("Missing environment variables", { status: 500 });
    }

    const url = new URL(context.request.url);
    const slug = url.searchParams.get("slug");

    const query = slug
      ? {
          filter: {
            property: "Slug",
            rich_text: { equals: slug }
          }
        }
      : {
          filter: {
            property: "Published",
            checkbox: { equals: true }
          },
          sorts: [
            {
              property: "Date",
              direction: "descending"
            }
          ]
        };

    const response = await fetch(
      `https://api.notion.com/v1/databases/${DATABASE_ID}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NOTION_KEY}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(query)
      }
    );

    const data = await response.json();

    return new Response(JSON.stringify(data, null, 2), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(
      "Function error: " + error.toString(),
      { status: 500 }
    );
  }
}
