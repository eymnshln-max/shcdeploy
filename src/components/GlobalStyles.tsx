import type { ThemeColors } from "../types";

interface GlobalStylesProps {
  C: ThemeColors;
}

export function GlobalStyles({ C }: GlobalStylesProps) {
  return (
    <style>{`
      :root{--ph:${C.placeholder}}
      textarea::placeholder{color:var(--ph)!important}
      @keyframes dotBounce{0%,80%,100%{transform:translateY(0);opacity:0.3}40%{transform:translateY(-4px);opacity:1}}
      *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;outline:none}
      button{outline:none!important;-webkit-appearance:none}
      button:focus,button:focus-visible,button:focus-within{outline:none!important;box-shadow:none!important}
      textarea:focus{outline:none}
      html{touch-action:manipulation}
      input,textarea,select{font-size:14px!important}
      ::-webkit-scrollbar{width:0}
    `}</style>
  );
}
