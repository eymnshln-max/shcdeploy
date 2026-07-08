export const APP_FONT_STACK = "-apple-system,BlinkMacSystemFont,'SF Pro Text','SF Pro Display','Helvetica Neue',sans-serif";

export function getAppColors(dark: boolean) {
  return dark ? {
    bg: "#1c1c1e",
    bg2: "#2c2c2e",
    bg3: "#3a3a3c",
    surface: "#2c2c2e",
    sep: "rgba(255,255,255,0.08)",
    text: "#ffffff",
    text2: "#ebebf5cc",
    text3: "#ebebf599",
    placeholder: "#636366",
    userBubble: "#2c2c2e",
    userText: "#ffffff",
    shcBubble: "#3a3a3c",
    shcText: "#ffffff",
    btnBg: "#3a3a3c",
    btnBorder: "rgba(255,255,255,0.12)",
    accent: "#0a84ff",
    dot: "#ffffff",
  } : {
    bg: "#ffffff",
    bg2: "#f5f5f7",
    bg3: "#efefef",
    surface: "#ffffff",
    sep: "rgba(0,0,0,0.08)",
    text: "#1d1d1f",
    text2: "#1d1d1f",
    text3: "#6e6e73",
    placeholder: "#aeaeb2",
    userBubble: "#1d1d1f",
    userText: "#ffffff",
    shcBubble: "#f5f5f7",
    shcText: "#1d1d1f",
    btnBg: "#ffffff",
    btnBorder: "rgba(0,0,0,0.12)",
    accent: "#0071e3",
    dot: "#1d1d1f",
  };
}

export function getRoutingTheme(dark: boolean) {
  return {
    RED: { color: "#c0392b", bg: dark ? "rgba(192,57,43,0.12)" : "#fff5f5", border: "rgba(192,57,43,0.25)", dot: "#c0392b" },
    YELLOW: { color: "#8e8e93", bg: dark ? "rgba(160,82,45,0.12)" : "#fffaf0", border: "rgba(160,82,45,0.25)", dot: "#92400e" },
    GREEN: { color: "#1a7a3c", bg: dark ? "rgba(26,122,60,0.12)" : "#f5fff9", border: "rgba(26,122,60,0.25)", dot: "#166534" },
    GREY: { color: "#8e8e93", bg: dark ? "rgba(142,142,147,0.12)" : "#f7f7f8", border: "rgba(142,142,147,0.30)", dot: "#8e8e93" },
  };
}
