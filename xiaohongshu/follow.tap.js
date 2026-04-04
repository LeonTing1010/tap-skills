export default {
  site: "xiaohongshu",
  name: "follow",
  description: "Follow the author of current note",
  columns: ["status", "user"],
  args: {},

  async run(tap) {
    // Extract author name and follow state from SSR state
    const info = await tap.eval(() => {
      const map = window.__INITIAL_STATE__?.note?.noteDetailMap || {}
      for (const [k, v] of Object.entries(map)) {
        if (!k || k === "undefined" || k === "") continue
        const note = v?.note || {}
        const user = note.user || {}
        return {
          nickname: user.nickname || "",
          followed: !!user.followed
        }
      }
      return null
    })

    if (!info || !info.nickname) {
      return [{ status: "error", user: "no note open — call open first" }]
    }

    if (info.followed) {
      return [{ status: "already_followed", user: info.nickname }]
    }

    // Click the follow button in the note detail
    await tap.click("关注")
    await tap.wait(2000)

    // Verify follow state changed
    const after = await tap.eval(() => {
      const map = window.__INITIAL_STATE__?.note?.noteDetailMap || {}
      for (const [k, v] of Object.entries(map)) {
        if (!k || k === "undefined" || k === "") continue
        return !!(v?.note?.user?.followed)
      }
      return false
    })

    return [{
      status: after ? "followed" : "clicked",
      user: info.nickname
    }]
  }
}
