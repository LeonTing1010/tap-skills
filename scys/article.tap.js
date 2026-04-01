export default {
  site: "scys",
  name: "article",
  description: "读取生财有术文章：标题、作者、互动数据、正文，自动跟进飞书文档全文",
  columns: ["type", "content", "meta"],
  args: {
    url: { type: "string", description: "文章 URL（可选，不传则读取当前页面）", required: false }
  },
  health: { min_rows: 3, non_empty: ["content"] },

  async run(tap, args) {
    if (args?.url) {
      await tap.nav(args.url)
      await tap.eval('new Promise(r => setTimeout(r, 2000))')
    }

    // 提取文章元数据 + 正文 + 飞书链接
    const meta = await tap.eval(() => {
      const postContent = document.querySelector(".post-content")
      const feishuAnchor = document.querySelector('a[href*="feishu.cn"], a[href*="lark.com"]')
      const likeEl = document.querySelector('[class*="like"]')
      const commentEl = document.querySelector('[class*="comment"]')
      const timeEl = document.querySelector('time, [class*="time"], [class*="date"]')
      const authorEl = document.querySelector('[class*="author"], .nickname')

      return {
        title: document.querySelector('h1, .post-title, [class*="title"]')?.innerText?.trim() || document.title,
        author: authorEl?.innerText?.trim()?.split("\n")[0] || "",
        time: timeEl?.getAttribute("datetime") || timeEl?.innerText?.trim() || "",
        likes: likeEl?.innerText?.trim()?.replace(/\D.*/, "") || "0",
        comments: commentEl?.innerText?.trim()?.replace(/\D.*/, "") || "0",
        body: postContent?.innerText?.trim() || "",
        feishuUrl: feishuAnchor?.href || ""
      }
    })

    const results = [
      { type: "title",  content: meta.title, meta: `author:${meta.author} time:${meta.time}` },
      { type: "engagement", content: `likes:${meta.likes} comments:${meta.comments}`, meta: "" }
    ]

    if (meta.body) {
      results.push({ type: "intro", content: meta.body.substring(0, 800), meta: "" })
    }

    // 跟进飞书文档，读取全文
    if (meta.feishuUrl) {
      results.push({ type: "feishu_link", content: meta.feishuUrl, meta: "fetching feishu doc..." })
      await tap.nav(meta.feishuUrl)
      await tap.eval('new Promise(r => setTimeout(r, 3000))')
      const docRows = await tap.run("feishu", "doc")
      for (const row of docRows) {
        results.push({ type: "doc_" + row.type, content: row.content, meta: row.level })
      }
    }

    return results
  }
}
