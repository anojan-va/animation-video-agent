export const TEXT_STYLES = {
  label_small_black: {
    css: { fontFamily: "KG Red Hands", fontSize: 40, fontWeight: "bold", color: "#333", textTransform: "uppercase" as const },
    highlight: "#000"
  },
  impact_big_red: {
    css: { fontFamily: "KG Red Hands", fontSize: 120, color: "#d92323", lineHeight: "0.9", textShadow: "5px 5px 0 rgba(0,0,0,0.2)" },
    highlight: "#ff0000"
  },
  checklist_yellow: {
    css: { fontFamily: "KG Red Hands", fontSize: 60, color: "white", display: "flex", flexDirection: "column" as const, gap: "20px", textShadow: "3px 3px 0 #000" },
    highlight: "#FFD700"
  }
};
