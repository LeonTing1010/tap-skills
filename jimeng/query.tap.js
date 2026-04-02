export default {
  site: "jimeng",
  name: "query",
  description: "即梦 AI 查询任务结果 — 调用本地 dreamina CLI 查询异步任务",
  columns: ["status", "submit_id", "type", "url", "download_path"],
  health: { min_rows: 1, non_empty: ["status"] },
  args: {
    submit_id: { type: "string", description: "任务提交 ID" },
    download_dir: { type: "string", default: "/tmp/jimeng", description: "下载目录" }
  },

  async run(tap, args) {
    const { execSync } = await import("node:child_process")
    const path = await import("node:path")
    const os = await import("node:os")

    const dir = args.download_dir.startsWith("~") 
      ? path.join(os.homedir(), args.download_dir.slice(2))
      : args.download_dir
    
    try {
      await import("node:fs").then(fs => {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      })
    } catch (e) {}

    const cmd = `dreamina query_result --submit_id=${args.submit_id} --download_dir="${dir}"`
    console.log("Running:", cmd)

    try {
      const output = execSync(cmd, { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 })
      
      // Try to parse JSON output
      let result
      try {
        result = JSON.parse(output)
      } catch (e) {
        result = { raw_output: output }
      }

      const status = result.gen_status || "success"
      const imageUrl = result.result_json?.images?.[0]?.image_url || ""
      const videoUrl = result.result_json?.videos?.[0]?.video_url || ""
      let downloadPath = ""

      // Extract downloaded file path
      const match = output.match(/Saved to[:\s]+([^\s\n]+)/i)
      if (match) downloadPath = match[1]

      return [{
        status: status,
        submit_id: args.submit_id,
        type: imageUrl ? "image" : videoUrl ? "video" : "unknown",
        url: imageUrl || videoUrl || "",
        download_path: downloadPath
      }]
    } catch (error) {
      console.error("dreamina CLI error:", error.message)
      return [{
        status: "error: " + error.message.split("\n")[0],
        submit_id: args.submit_id,
        type: "",
        url: "",
        download_path: ""
      }]
    }
  }
}
