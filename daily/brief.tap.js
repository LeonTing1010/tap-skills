/**
 * daily/brief — Cross-app daily briefing.
 * Runtime: macos
 *
 * Composes calendar/today + reminders/pending into a unified brief.
 * Optionally saves to Apple Notes via notes/create.
 *
 * This is the killer macOS tap: one command, multiple apps, zero API.
 *
 *   tap --runtime macos daily brief
 *   tap --runtime macos daily brief --save true
 */
export default {
  site: "daily",
  name: "brief",
  description: "Daily briefing from Calendar + Reminders",
  columns: ["type", "title", "detail", "source"],
  args: {
    save: { type: "string", default: "false", description: "Save to Apple Notes" },
  },

  async run(page, args) {
    const rows = [];

    // --- Calendar events (composition: page.tap) ---
    try {
      const calResult = await page.tap("calendar", "today");
      for (const event of (calResult.rows || [])) {
        rows.push({
          type: "event",
          title: event.title,
          detail: [event.time, event.location].filter(Boolean).join(" @ "),
          source: event.calendar,
        });
      }
    } catch (e) {
      rows.push({ type: "error", title: "Calendar", detail: String(e), source: "" });
    }

    // --- Pending reminders (composition: page.tap) ---
    try {
      const remResult = await page.tap("reminders", "pending");
      for (const item of (remResult.rows || [])) {
        rows.push({
          type: "todo",
          title: item.title,
          detail: item.dueDate ? `due ${item.dueDate}` : "",
          source: item.list,
        });
      }
    } catch (e) {
      rows.push({ type: "error", title: "Reminders", detail: String(e), source: "" });
    }

    // --- Save to Notes if requested (composition: page.tap) ---
    if (args.save === "true" || args.save === true) {
      const today = new Date().toISOString().slice(0, 10);
      const body = rows
        .filter(r => r.type !== "error")
        .map(r => `[${r.type}] ${r.title}${r.detail ? " — " + r.detail : ""}`)
        .join("\n");

      try {
        await page.tap("notes", "create", {
          title: `Daily Brief ${today}`,
          body: body || "No events or reminders today.",
        });
        rows.push({ type: "saved", title: `Daily Brief ${today}`, detail: "→ Apple Notes", source: "notes" });
      } catch (e) {
        rows.push({ type: "error", title: "Notes save", detail: String(e), source: "" });
      }
    }

    return rows;
  },
};
