/**
 * calendar/today — Read today's calendar events via JXA.
 * Runtime: macos
 */
export default {
  site: "calendar",
  name: "today",
  intent: "read",
  description: "Today's calendar events",
  columns: ["title", "time", "location", "calendar", "notes"],

  async tap(tap) {
    const events = await tap.eval(`
      var cal = Application("Calendar");
      var now = new Date();
      var start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      var end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

      var results = [];
      var calendars = cal.calendars();
      for (var c = 0; c < calendars.length; c++) {
        var calName = String(calendars[c].name());
        var evts = calendars[c].events.whose({
          _and: [
            { startDate: { _greaterThan: start } },
            { startDate: { _lessThan: end } }
          ]
        })();
        for (var i = 0; i < evts.length; i++) {
          var e = evts[i];
          var s = e.startDate();
          var eEnd = e.endDate();
          var hh = String(s.getHours()).padStart(2, "0");
          var mm = String(s.getMinutes()).padStart(2, "0");
          var ehh = String(eEnd.getHours()).padStart(2, "0");
          var emm = String(eEnd.getMinutes()).padStart(2, "0");
          results.push({
            title: String(e.summary()),
            time: hh + ":" + mm + "-" + ehh + ":" + emm,
            location: String(e.location() || ""),
            calendar: calName,
            notes: String(e.description() || "").substring(0, 200),
          });
        }
      }
      results.sort(function(a, b) { return a.time < b.time ? -1 : 1; });
      JSON.stringify(results);
    `);

    return events || [];
  },
};
