export async function onRequest(context) {
  try {
    const NOTION_KEY = context.env.NOTION_KEY;
    const DATABASE_ID = context.env.NOTION_DATABASE_ID;

    const url = new URL(context.request.url);
    const slug = url.searchParams.get("slug");

    // If slug provided → return single post
    if (slug) {
      const queryResponse = await fetch(
        `https://api.notion.com/v1/databases/${DATABASE_ID}/query`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${NOTION_KEY}`,
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            filter: {
              property: "Slug",
              rich_text: { equals: slug }
            }
          })
        }
      );

      const queryData = await queryResponse.json();

      if (!queryData.results.length) {
        return new Response("Post not found", { status: 404 });
      }

      const post = queryData.results[0];

      // Fetch page blocks
      const blocksResponse = await fetch(
        `https://api.notion.com/v1/blocks/${post.id}/children`,
        {
          headers: {
            Authorization: `Bearer ${NOTION_KEY}`,
            "Notion-Version": "2022-06-28"
          }
        }
      );

      const blocksData = await blocksResponse.json();

      return new Response(
        JSON.stringify({
          post,
          blocks: blocksData.results
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Otherwise → return blog list
    const response = await fetch(
      `https://api.notion.com/v1/databases/${DATABASE_ID}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NOTION_KEY}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
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
        })
      }
    );

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(error.toString(), { status: 500 });
  }
}
