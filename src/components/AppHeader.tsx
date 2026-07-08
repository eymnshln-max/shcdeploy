import { CloseSessionButton } from "./CloseSessionButton";
import type { Lang, OnlineMeta, StateSetter, ThemeColors } from "../types";

interface AppHeaderProps {
  C: ThemeColors;
  SF: string;
  dark: boolean;
  setDark: StateSetter<boolean>;
  manualTestMode: boolean;
  onlineTestError: string | null;
  onlineMeta: OnlineMeta;
  doctorMode: boolean;
  setDoctorMode: StateSetter<boolean>;
  lang: Lang;
  onReset: () => void;
}

export function AppHeader({
  C,
  SF,
  dark,
  setDark,
  manualTestMode,
  onlineTestError,
  onlineMeta,
  doctorMode,
  setDoctorMode,
  lang,
  onReset,
}: AppHeaderProps) {
  return (
    <header style={{minHeight:52,borderBottom:`1px solid ${C.sep}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 16px",paddingTop:"env(safe-area-inset-top)",boxSizing:"border-box",flexShrink:0,background:dark?"rgba(28,28,30,0.9)":"rgba(255,255,255,0.9)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0,flex:1}}>
        <button onClick={()=>setDark((v: boolean)=>!v)} style={{width:28,height:28,borderRadius:"50%",border:"none",background:"transparent",color:C.text3,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          {dark
            ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
          }
        </button>
        <div style={{width:26,height:26,borderRadius:6,background:C.dot,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={dark?"#1d1d1f":"white"} strokeWidth="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        </div>
        <div style={{minWidth:0}}>
          <div style={{fontSize:11,fontWeight:600,color:C.text,letterSpacing:"-0.02em",whiteSpace:"nowrap"}}>SHC</div>
          <div style={{fontSize:8,color:C.text3,letterSpacing:"0.01em",whiteSpace:"nowrap"}}>Standard HealthCare</div>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        {manualTestMode && (
          <div title={onlineTestError || "Online-only mode"} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 8px",borderRadius:12,background:onlineTestError?"rgba(192,57,43,.14)":onlineMeta.confirmed?"rgba(26,122,60,.14)":"rgba(160,82,45,.14)",color:onlineTestError?"#c0392b":onlineMeta.confirmed?"#1a7a3c":"#a0522d",fontSize:9,fontWeight:600,whiteSpace:"nowrap"}}>
            <span style={{width:5,height:5,borderRadius:"50%",background:"currentColor"}}/>
            {onlineTestError?"TEST STOP":onlineMeta.confirmed?`ONLINE · ${onlineMeta.requestCount}`:"ONLINE TEST"}
          </div>
        )}
        <button onClick={()=>setDoctorMode((v: boolean)=>!v)} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:14,background:doctorMode?C.dot:"rgba(128,128,128,0.12)",border:"none",color:doctorMode?(dark?"#1d1d1f":"#ffffff"):C.text3,fontSize:10,fontWeight:500,cursor:"pointer",fontFamily:SF,transition:"all 0.2s",letterSpacing:"-0.01em"}}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
          {lang==="tr"?"Doktor":"Doctor"}
        </button>
        <CloseSessionButton lang={lang} onConfirm={onReset} dark={dark}/>
      </div>
    </header>
  );
}
