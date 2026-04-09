export async function onRequestGet(context) {
  const NOTION_KEY = context.env.NOTION_KEY;
  const DATABASE_ID = context.env.NOTION_DATABASE_ID;

  const { searchParams } = new URL(context.request.url);
  const slug = searchParams.get("slug");

  // Validate slug: only allow lowercase letters, numbers and hyphens
  if (slug !== null && !/^[a-z0-9-]{1,100}$/.test(slug)) {
    return new Response(JSON.stringify({ error: "Invalid slug" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // If slug exists → fetch single published post
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
              and: [
                {
                  property: "Slug",
                  rich_text: { equals: slug },
                },
                {
                  property: "Published",
                  checkbox: { equals: true },
                },
              ],
            },
          }),
        }
      );

      if (!queryRes.ok) {
        throw new Error(`Notion query failed: ${queryRes.status}`);
      }

      const queryData = await queryRes.json();

      if (!queryData.results.length) {
        return new Response(JSON.stringify({ error: "Post not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const post = queryData.results[0];
      const pageId = post.id;

      const blocksRes = await fetch(
        `https://api.notion.com/v1/blocks/${pageId}/children`,
        {
          headers: {
            Authorization: `Bearer ${NOTION_KEY}`,
            "Notion-Version": "2022-06-28",
          },
        }
      );

      if (!blocksRes.ok) {
        throw new Error(`Notion blocks fetch failed: ${blocksRes.status}`);
      }

      const blocksData = await blocksRes.json();

      return new Response(
        JSON.stringify({ post, blocks: blocksData.results }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Otherwise → return all published posts
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
          sorts: [{ property: "Date", direction: "descending" }],
        }),
      }
    );

    if (!listRes.ok) {
      throw new Error(`Notion list failed: ${listRes.status}`);
    }

    const listData = await listRes.json();

    return new Response(JSON.stringify(listData), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to load content" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
