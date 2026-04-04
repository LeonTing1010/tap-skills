export default {
  site: "lead-gen",
  name: "intent-analyzer",
  description: "Analyze text for purchase intent - 5 phrase detection",
  
  args: {
    text: { type: "string", desc: "Text to analyze" }
  },
  health: { min_rows: 1, non_empty: ["intent"] },

  extract: async (args) => {
    const text = args.text || ""
    const patterns = [
      { pattern: /手动做了\d+(天|周|月|年)|doing this manually for|I have been doing this manually/, label: "手动做了X时间", score: 5 },
      { pattern: /便宜.*替代|cheaper alternative|更便宜的|找替代/, label: "找便宜替代", score: 4 },
      { pattern: /(竟然|为什么).*没有|can't believe there's no|竟然没有/, label: "竟然没有", score: 4 },
      { pattern: /overkill|太复杂|too complex|对我来说是|for what i need/, label: "overkill", score: 3 },
      { pattern: /我只需要|我就想要|I just need|just want|只需要/, label: "只需要", score: 5 }
    ]
    
    const matched = []
    let score = 0
    
    for (const p of patterns) {
      if (p.pattern.test(text)) {
        matched.push(p.label)
        score += p.score
      }
    }
    
    let intent = "LOW"
    if (score >= 8) intent = "HIGH"
    else if (score >= 4) intent = "MEDIUM"
    
    return [{
      text: text.substring(0, 100),
      intent,
      score,
      matched_phrases: matched.join(", ")
    }]
  }
}
