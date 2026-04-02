export default {
  site: "jimeng",
  name: "image2image",
  description: "即梦 AI 图生图 — 调用本地 dreamina CLI 基于图片生成",
  columns: ["status", "submit_id", "image_url", "download_path"],
  health: { min_rows: 1, non_empty: ["status"] },
  args: {
    image: { type: "string", description: "输入图片路径" },
    prompt: { type: "string", description: "修改描述" },
    resolution: { type: "string", default: "2k", description: "分辨率：2k, 1k" },
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

    // Resolve image path
    let imagePath = args.image
    if (imagePath.startsWith("~")) {
      imagePath = path.join(os.homedir(), imagePath.slice(2))
    }

    const cmd = [
      "dreamina",
      "image2image",
      `--images="${imagePath}"`,
      `--prompt="${args.prompt.replace(/"/g, '\\"')}"`,
      `--resolution_type=${args.resolution}`,
      "--poll=30"
    ].join(" ")

    console.log("Running:", cmd)

    try {
      const output = execSync(cmd, { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 })
      const result = JSON.parse(output)

      if (result.gen_status !== "success") {
        return [{ status: result.gen_status, submit_id: result.submit_id || "", image_url: "", download_path: "" }]
      }

      const imageUrl = result.result_json?.images?.[0]?.image_url || ""
      const submitId = result.submit_id || ""
      let downloadPath = ""

      if (submitId) {
        try {
          const downloadCmd = `dreamina query_result --submit_id=${submitId} --download_dir="${dir}"`
          console.log("Downloading:", downloadCmd)
          const dlOutput = execSync(downloadCmd, { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 })
          const match = dlOutput.match(/Saved to[:\s]+([^\s\n]+)/i)
          if (match) downloadPath = match[1]
        } catch (e) {
          console.log("Download info:", e.message)
        }
      }

      return [{
        status: "success",
        submit_id: submitId,
        image_url: imageUrl,
        download_path: downloadPath
      }]
    } catch (error) {
      console.error("dreamina CLI error:", error.message)
      return [{
        status: "error: " + error.message.split("\n")[0],
        submit_id: "",
        image_url: "",
        download_path: ""
      }]
    }
  }
}
