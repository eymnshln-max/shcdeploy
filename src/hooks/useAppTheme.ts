import { useEffect } from "react";

export function useAppTheme(dark: boolean) {
  useEffect(() => {
    const color = dark ? "#1c1c1e" : "#ffffff";
    document.documentElement.style.setProperty("background", color, "important");
    document.body.style.setProperty("background", color, "important");

    const root = document.getElementById("root");
    if (root) root.style.setProperty("background", color, "important");

    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute("content", color);

    const statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (statusBarMeta) statusBarMeta.setAttribute("content", dark ? "black" : "default");
  }, [dark]);
}
