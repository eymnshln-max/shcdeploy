import { useState } from "react";
import type { Lang } from "../types";

interface CloseSessionButtonProps {
  lang: Lang;
  onConfirm: () => void;
  dark: boolean;
}

export function CloseSessionButton({lang, onConfirm, dark}: CloseSessionButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const mutedRed = dark ? "#a05050" : "#c0392b";
  const subtleRed = dark ? "#7a3a3a" : "#c0392b";
  if (confirming) {
    return (
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <span style={{fontSize:11,color:dark?"#8e8e93":"#6e6e73",whiteSpace:"nowrap"}}>{lang==="tr"?"Emin misin?":"Sure?"}</span>
        <button onClick={()=>{setConfirming(false);onConfirm();}} style={{fontSize:11,fontWeight:500,color:mutedRed,background:"transparent",border:"none",cursor:"pointer",fontFamily:"inherit",padding:"0 4px"}}>
          {lang==="tr"?"Evet":"Yes"}
        </button>
        <button onClick={()=>setConfirming(false)} style={{fontSize:11,fontWeight:500,color:dark?"#8e8e93":"#6e6e73",background:"transparent",border:"none",cursor:"pointer",fontFamily:"inherit",padding:"0 4px"}}>
          {lang==="tr"?"İptal":"Cancel"}
        </button>
      </div>
    );
  }
  return (
    <button onClick={()=>setConfirming(true)} style={{fontSize:11,fontWeight:400,color:dark?"#8e8e93":"#6e6e73",background:"transparent",border:"none",cursor:"pointer",fontFamily:"inherit",padding:"4px 8px",borderRadius:6,transition:"color 0.15s"}}
      onMouseEnter={e=>e.currentTarget.style.color=subtleRed}
      onMouseLeave={e=>e.currentTarget.style.color=dark?"#8e8e93":"#6e6e73"}>
      {lang==="tr"?"Seansı Kapat":"End Session"}
    </button>
  );
}
