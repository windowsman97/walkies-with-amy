export async function onRequestGet(context) {
  const NOTION_KEY = context.env.NOTION_KEY;
  const DATABASE_ID = context.env.NOTION_DATABASE_ID;

  const { searchParams } = new URL(context.request.url);
  const slug = searchParams.get("slug");

  // If slug exists → fetch single post
  if (slug) {
    const queryRes = await fetch(
      `https://api.notion.com/v1/databases/${DATABASE_ID}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NOTION_KEY}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filter: {
            property: "Slug",
            rich_text: { equals: slug },
          },
        }),
      }
    );

    const queryData = await queryRes.json();

    if (!queryData.results.length) {
      return new Response(JSON.stringify({ error: "Post not found" }), {
        status: 404,
      });
    }

    const post = queryData.results[0];
    const pageId = post.id;

    // 🔥 Fetch page blocks properly
    const blocksRes = await fetch(
      `https://api.notion.com/v1/blocks/${pageId}/children`,
      {
        headers: {
          Authorization: `Bearer ${NOTION_KEY}`,
          "Notion-Version": "2022-06-28",
        },
      }
    );

    const blocksData = await blocksRes.json();

    return new Response(
      JSON.stringify({
        post,
        blocks: blocksData.results,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Otherwise → return all posts
  const listRes = await fetch(
    `https://api.notion.com/v1/databases/${DATABASE_ID}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NOTION_KEY}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filter: {
          property: "Published",
          checkbox: { equals: true },
        },
        sorts: [
          {
            property: "Date",
            direction: "descending",
          },
        ],
      }),
    }
  );

  const listData = await listRes.json();

  return new Response(JSON.stringify(listData), {
    headers: { "Content-Type": "application/json" },
  });
}
