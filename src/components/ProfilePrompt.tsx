import type { Lang, MessageRole, StateSetter, ThemeColors, TranslationPack } from "../types";

interface ProfilePromptProps {
  t: TranslationPack;
  lang: Lang;
  C: ThemeColors;
  SF: string;
  dark: boolean;
  input: string;
  setInput: StateSetter<string>;
  profileIdx: number;
  addMsg: (text: string, role?: MessageRole) => void;
  handleProfileAnswer: (text: string) => void | Promise<void>;
}

export function ProfilePrompt({
  t,
  lang,
  C,
  SF,
  dark,
  input,
  setInput,
  profileIdx,
  addMsg,
  handleProfileAnswer,
}: ProfilePromptProps) {
  const q = t.questions[profileIdx];
  if (!q) return null;

  if (q.type === "choice") {
    return (
      <div style={{padding:"4px 20px 4px 56px",display:"flex",gap:8,flexWrap:"wrap"}}>
        {(q.choices || []).map((choice) =>(
          <button key={choice} onClick={()=>{
            addMsg(choice,"user");
            handleProfileAnswer(choice);
          }} style={{
            padding:"10px 22px",borderRadius:20,
            border:`1.5px solid ${C.btnBorder}`,
            background:C.btnBg,color:C.text,
            fontSize:13,fontWeight:400,cursor:"pointer",
            fontFamily:SF,letterSpacing:"-0.01em",transition:"all 0.15s",
          }}
          onMouseEnter={e=>{e.currentTarget.style.background=dark?"#48484a":"#f5f5f7";e.currentTarget.style.color=C.text;}}
          onMouseLeave={e=>{e.currentTarget.style.background=C.btnBg;e.currentTarget.style.color=C.text;}}>
            {choice}
          </button>
        ))}
      </div>
    );
  }

  if (q.type === "number") {
    const cfg = {
      age:       {unit:lang==="tr"?"yaş":"yrs", hint:"18-120", min:18, max:120},
      height_cm: {unit:"cm", hint:"140-220",    min:140, max:220},
      weight_kg: {unit:"kg", hint:"40-200",     min:40,  max:200},
    }[q.key as "age" | "height_cm" | "weight_kg"] || {unit:"", hint:"", min:0, max:999};
    const display = input || "";
    const numVal = parseInt(display, 10);
    const inRange = display.length > 0 && !isNaN(numVal) && numVal >= cfg.min && numVal <= cfg.max;
    const hasInput = display.length > 0;
    const tap = (key: string) => {
      if (key === "⌫") {
        setInput((value: string) => value.slice(0, -1));
      } else if (key === "OK") {
        if (!hasInput) return;
        if (!inRange) {
          const hint = lang==="tr"
            ? `Lütfen geçerli bir değer girin (${cfg.min}-${cfg.max} ${cfg.unit}).`
            : `Please enter a valid value (${cfg.min}-${cfg.max} ${cfg.unit}).`;
          addMsg(hint);
          setInput("");
          return;
        }
        addMsg(display,"user");
        handleProfileAnswer(display);
        setInput("");
      } else {
        if (input.length >= 3) return;
        setInput((value: string) => value + key);
      }
    };
    const keys = ["1","2","3","4","5","6","7","8","9","⌫","0","OK"];
    return (
      <div style={{padding:"6px 20px 6px 20px",display:"flex",gap:14,alignItems:"flex-start"}}>
        <div style={{display:"flex",flexDirection:"column",justifyContent:"center",minWidth:58,paddingTop:4}}>
          <div style={{fontSize:22,fontWeight:500,color:display?C.text:C.text3,fontFamily:SF,letterSpacing:"-0.02em",lineHeight:1}}>{display||"—"}</div>
          <div style={{fontSize:10,color:C.text3,marginTop:3}}>{cfg.unit} · {cfg.hint}</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5}}>
          {keys.map((key) =>(
            <button key={key} onClick={()=>tap(key)} style={{
              width:44,height:36,borderRadius:9,border:"none",
              background:key==="OK"?(inRange?C.dot:C.bg3):key==="⌫"?C.bg2:C.btnBg,
              color:key==="OK"?(inRange?(dark?"#1d1d1f":"#ffffff"):C.text3):C.text,
              fontSize:key==="⌫"?15:key==="OK"?12:17,
              fontWeight:key==="OK"?500:400,
              cursor:key==="OK"&&!inRange?"default":"pointer",
              fontFamily:SF,
              boxShadow:"0 1px 2px rgba(0,0,0,0.07)",
              transition:"opacity 0.1s",
            }}
            onMouseEnter={e=>{if(key!=="OK"||inRange)e.currentTarget.style.opacity="0.7";}}
            onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
              {key}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
