/**
 * reminders/pending — Read incomplete reminders via JXA.
 * Runtime: macos
 */
export default {
  site: "reminders",
  name: "pending",
  description: "Incomplete reminders",
  columns: ["title", "list", "dueDate", "priority", "notes"],

  async run(tap) {
    const items = await tap.eval(`
      var app = Application("Reminders");
      var results = [];
      var lists = app.lists();
      for (var l = 0; l < lists.length; l++) {
        var listName = String(lists[l].name());
        var reminders = lists[l].reminders.whose({ completed: false })();
        for (var i = 0; i < Math.min(reminders.length, 50); i++) {
          var r = reminders[i];
          var due = r.dueDate();
          var dueStr = "";
          if (due) {
            dueStr = due.getFullYear() + "-" +
              String(due.getMonth() + 1).padStart(2, "0") + "-" +
              String(due.getDate()).padStart(2, "0");
          }
          results.push({
            title: String(r.name()),
            list: listName,
            dueDate: dueStr,
            priority: String(r.priority()),
            notes: String(r.body() || "").substring(0, 200),
          });
        }
      }
      JSON.stringify(results);
    `);

    return items || [];
  },
};
