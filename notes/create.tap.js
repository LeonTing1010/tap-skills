/**
 * notes/create — Create a note in Apple Notes via JXA.
 * Runtime: macos
 */
export default {
  site: "notes",
  name: "create",
  intent: "write",
  description: "Create a note in Apple Notes",
  columns: ["id", "name", "folder"],
  args: {
    title: { type: "string", required: true, description: "Note title" },
    body:  { type: "string", required: true, description: "Note body" },
    folder: { type: "string", default: "Notes", description: "Target folder" },
  },

  async tap(tap, args) {
    const result = await tap.eval(`
      var app = Application("Notes");
      var title = ${JSON.stringify(args.title)};
      var body = ${JSON.stringify(args.body)};

      var htmlBody = "<h1>" + title + "</h1>" + body.replace(/\\n/g, "<br>");
      var note = app.make({
        new: "note",
        at: app.defaultAccount().folders[0],
        withProperties: { body: htmlBody }
      });

      JSON.stringify({
        id: String(note.id()),
        name: String(note.name()),
        folder: String(app.defaultAccount().folders[0].name()),
      });
    `);

    return result ? [result] : [];
  },
};
