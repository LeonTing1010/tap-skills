export default {
  site: "jimeng",
  name: "text2image",
  description: "即梦 AI 文生图 — 调用本地 dreamina CLI 生成图片",
  columns: ["status", "submit_id", "image_url", "download_path"],
  health: { min_rows: 1, non_empty: ["status"] },
  args: {
    prompt: { type: "string", description: "图片描述" },
    ratio: { type: "string", default: "1:1", description: "宽高比：1:1, 16:9, 9:16, 3:4, 4:3" },
    resolution: { type: "string", default: "2k", description: "分辨率：2k, 1k" },
    download_dir: { type: "string", default: "/tmp/jimeng", description: "下载目录" }
  },

  async run(tap, args) {
    let downloadDir = args.download_dir || "/tmp/jimeng"
    if (downloadDir.startsWith("~")) {
      try {
        const os = await import("node:os")
        downloadDir = downloadDir.replace(/^~/, os.homedir())
      } catch (e) {
        downloadDir = "/tmp/jimeng"
      }
    }
    
    // Ensure download directory exists
    try {
      await Deno.mkdir(downloadDir, { recursive: true })
    } catch (e) {}

    const prompt = args.prompt || ""
    const ratio = args.ratio || "1:1"
    const resolution = args.resolution || "2k"
    
    console.log("Running: dreamina text2image")

    try {
      // Use Deno.Command to execute dreamina CLI
      const command = new Deno.Command("dreamina", {
        args: ["text2image", `--prompt=${prompt}`, `--ratio=${ratio}`, `--resolution_type=${resolution}`, "--poll=30"],
        stdout: "piped",
        stderr: "piped",
        clearEnv: false
      })

      const { code, stdout, stderr } = await command.output()
      
      if (code !== 0) {
        const error = new TextDecoder().decode(stderr)
        throw new Error(error.split("\n")[0] || "CLI failed")
      }

      const output = new TextDecoder().decode(stdout)
      const result = JSON.parse(output)

      if (result.gen_status !== "success") {
        return [{ status: result.gen_status, submit_id: result.submit_id || "", image_url: "", download_path: "" }]
      }

      const imageUrl = result.result_json?.images?.[0]?.image_url || ""
      const submitId = result.submit_id || ""
      let downloadPath = ""

      // Download image
      if (submitId) {
        try {
          const dlCommand = new Deno.Command("dreamina", {
            args: ["query_result", `--submit_id=${submitId}`, `--download_dir=${downloadDir}`],
            stdout: "piped",
            stderr: "piped",
            clearEnv: false
          })
          const { stdout: dlStdout } = await dlCommand.output()
          const dlOutput = new TextDecoder().decode(dlStdout)
          const match = dlOutput.match(/Saved to[:\s]+([^\s\n]+)/i)
          if (match) downloadPath = match[1]
        } catch (e) {
          console.log("Download info:", e.message)
        }
      }

      return [{ status: "success", submit_id: submitId, image_url: imageUrl, download_path: downloadPath }]
    } catch (error) {
      console.error("dreamina CLI error:", error.message)
      return [{ status: "error: " + error.message.split("\n")[0], submit_id: "", image_url: "", download_path: "" }]
    }
  }
}
