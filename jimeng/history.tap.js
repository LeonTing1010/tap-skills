export default {
  site: "jimeng",
  name: "history",
  description: "即梦 AI 查看历史任务 — 调用本地 dreamina CLI 查看任务列表",
  columns: ["submit_id", "status", "type", "created_at"],
  health: { min_rows: 0 },
  args: {
    status: { type: "string", default: "", description: "筛选状态：success, failed, processing" },
    submit_id: { type: "string", default: "", description: "按 submit_id 筛选特定任务" },
    limit: { type: "int", default: 10, description: "返回结果数量" }
  },

  async run(tap, args) {
    const { execSync } = await import("node:child_process")

    const cmdParts = ["dreamina", "list_task"]
    if (args.status) cmdParts.push(`--gen_status=${args.status}`)
    if (args.submit_id) cmdParts.push(`--submit_id=${args.submit_id}`)
    
    const cmd = cmdParts.join(" ")
    console.log("Running:", cmd)

    try {
      const output = execSync(cmd, { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 })
      const result = JSON.parse(output)
      
      const tasks = result.task_list || []
      
      return tasks.slice(0, args.limit).map(task => ({
        submit_id: task.submit_id || "",
        status: task.gen_status || "",
        type: (task.result_json?.images?.length > 0) ? "image" 
              : (task.result_json?.videos?.length > 0) ? "video" : "unknown",
        created_at: task.created_at || ""
      }))
    } catch (error) {
      console.error("dreamina CLI error:", error.message)
      return [{
        submit_id: "",
        status: "error: " + error.message.split("\n")[0],
        type: "",
        created_at: ""
      }]
    }
  }
}
