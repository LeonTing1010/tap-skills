export default {
  site: "tap",
  name: "sort",
  description: "Sort rows by field (numeric or alphabetic, asc or desc)",
  args: {
    field: { type: "string", description: "Column name to sort by" },
    order: { type: "string", default: "desc", description: "asc or desc" },
  },

  transform(rows, args) {
    const dir = args.order === "asc" ? 1 : -1
    return [...rows].sort((a, b) => {
      const va = a[args.field], vb = b[args.field]
      const na = Number(va), nb = Number(vb)
      if (!isNaN(na) && !isNaN(nb)) return (na - nb) * dir
      return String(va).localeCompare(String(vb)) * dir
    })
  }
}
