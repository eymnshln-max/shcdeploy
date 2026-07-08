import { AKINATOR_GATES } from "../clinical/questions";
import type {
  AkinatorAnswer,
  AkinatorGate,
  AkinatorQuestion,
  Lang,
  StateSetter,
  ThemeColors,
  UiPhase,
} from "../types";

interface AkinatorButton {
  key: AkinatorAnswer;
  label: string;
  bg: string;
  color: string;
  border: string;
}

interface AkinatorPanelProps {
  C: ThemeColors;
  SF: string;
  dark: boolean;
  lang: Lang;
  uiPhase: UiPhase;
  loading: boolean;
  offlineMode: boolean;
  akinatorGate: string | null;
  akinatorDone: boolean;
  akinatorCurrent: AkinatorQuestion | null;
  akinatorScale: number;
  setAkinatorScale: StateSetter<number>;
  handleGateSelect: (gateId: string) => void;
  handleAkinatorAnswer: (answer: AkinatorAnswer | "scale", value?: number) => void;
}

export function AkinatorPanel({
  C,
  SF,
  dark,
  lang,
  uiPhase,
  loading,
  offlineMode,
  akinatorGate,
  akinatorDone,
  akinatorCurrent,
  akinatorScale,
  setAkinatorScale,
  handleGateSelect,
  handleAkinatorAnswer,
}: AkinatorPanelProps) {
  if (!offlineMode || uiPhase === "profiling" || loading) return null;

  if (!akinatorGate && !akinatorDone) {
    const gates = (AKINATOR_GATES as Record<Lang, AkinatorGate[]>)[lang] || AKINATOR_GATES.tr;
    return (
      <div style={{padding:"8px 20px 8px 20px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,maxWidth:380}}>
          {gates.map((g) =>(
            <button key={g.id} onClick={()=>handleGateSelect(g.id)} style={{
              display:"flex",flexDirection:"column",alignItems:"flex-start",
              padding:"12px 14px",borderRadius:14,
              border:`1.5px solid ${C.btnBorder}`,
              background:C.btnBg,cursor:"pointer",fontFamily:SF,
              textAlign:"left",transition:"all 0.15s",gap:4,
            }}
            onMouseEnter={e=>{e.currentTarget.style.background=dark?"#48484a":"#f0f0f2";e.currentTarget.style.borderColor=C.accent;}}
            onMouseLeave={e=>{e.currentTarget.style.background=C.btnBg;e.currentTarget.style.borderColor=C.btnBorder;}}>
              <span style={{fontSize:11,fontWeight:500,color:C.text,letterSpacing:"-0.01em",lineHeight:1.3}}>{g.label}</span>
              <span style={{fontSize:10,color:C.text3,lineHeight:1.3}}>{g.sub}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!akinatorGate || !akinatorCurrent || akinatorDone) return null;

  const q = akinatorCurrent;
  if (q.type === "yn") {
    const buttons: AkinatorButton[] = [
      { key:"yes", label:lang==="tr"?"✓ Evet":"✓ Yes", bg:dark?"#1a3a1a":"#f0fff4", color:"#166534", border:"rgba(22,101,52,0.3)" },
      { key:"no",  label:lang==="tr"?"✕ Hayır":"✕ No", bg:dark?"#3a1a1a":"#fff5f5", color:"#c0392b", border:"rgba(192,57,43,0.3)" },
    ];
    return (
      <div style={{padding:"6px 20px 6px 56px"}}>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
          {buttons.map((button) =>(
            <button key={button.key} onClick={()=>handleAkinatorAnswer(button.key)} style={{
              padding:"11px 18px",borderRadius:20,border:`1.5px solid ${button.border}`,
              background:button.bg,color:button.color,fontSize:12,fontWeight:500,cursor:"pointer",
              fontFamily:SF,letterSpacing:"-0.01em",transition:"all 0.15s",
            }}
            onMouseEnter={e=>e.currentTarget.style.opacity="0.8"}
            onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
              {button.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (q.type === "scale") {
    return (
      <div style={{padding:"6px 20px 10px 56px"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <span style={{fontSize:10,color:C.text3,minWidth:12}}>1</span>
          <input type="range" min="1" max="10" value={akinatorScale}
            onChange={e=>setAkinatorScale(Number(e.target.value))}
            style={{flex:1,accentColor:C.accent,cursor:"pointer"}}/>
          <span style={{fontSize:10,color:C.text3,minWidth:16}}>10</span>
          <div style={{
            minWidth:38,height:38,borderRadius:"50%",flexShrink:0,
            background:akinatorScale>=8?"#c0392b":akinatorScale>=5?"#a0522d":"#1a7a3c",
            display:"flex",alignItems:"center",justifyContent:"center",
            color:"white",fontSize:13,fontWeight:600,fontFamily:SF,
            transition:"background 0.2s",
          }}>
            {akinatorScale}
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <button onClick={()=>handleAkinatorAnswer("scale", akinatorScale)} style={{
            padding:"10px 24px",borderRadius:20,border:"none",flexShrink:0,
            background:C.dot,color:dark?"#1d1d1f":"white",
            fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:SF,letterSpacing:"-0.01em",
          }}>
            {lang==="tr"?"Onayla":"Confirm"} - {akinatorScale}/10
          </button>
        </div>
      </div>
    );
  }

  return null;
}
