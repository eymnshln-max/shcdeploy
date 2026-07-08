import { useState, type ReactNode } from "react";
import type { Lang, StateSetter } from "../types";

type OnboardingStep = "lang" | "mode" | "info";
type ModeChoice = "online" | "offline";

interface OnboardingScreenProps {
  onStart: (lang: Lang, offlineMode: boolean) => void;
  dark: boolean;
  setDark: StateSetter<boolean>;
}

interface LangOption {
  code: Lang;
  label: string;
  sub: string;
}

interface ModeOption {
  code: ModeChoice;
  label: string;
  sub: string;
  color: string;
}

interface InfoBullet {
  key: "science" | "medical" | "alert" | "lock";
  title: string;
  body: string;
}

interface OnboardingContent {
  proceed: string;
  infoTitle: string;
  bullets: InfoBullet[];
  consentLabel: string;
  startBtn: string;
  back: string;
}

export function OnboardingScreen({onStart, dark, setDark}: OnboardingScreenProps) {
  const [step, setStep] = useState<OnboardingStep>("lang");
  const [selected, setSelected] = useState<Lang | null>(null);
  const [selectedMode, setSelectedMode] = useState<ModeChoice | null>(null);
  const [consent, setConsent] = useState(false);
  const SF = "-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif";
  const bg  = dark ? "#1c1c1e" : "#ffffff";
  const bg2 = dark ? "#2c2c2e" : "#f5f5f7";
  const txt = dark ? "#ffffff" : "#1d1d1f";
  const txt3= dark ? "#aeaeb2" : "#6e6e73";
  const sep = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  const content: Record<Lang, OnboardingContent> = {
    en: {
      proceed: "Continue",
      infoTitle: "Before we begin",
      bullets: [
        { key:"science", title: "Evidence-based", body: "70+ clinical patterns · ADA · AHA · NICE · WHO." },
        { key:"medical", title: "Not a diagnosis", body: "Decision-support only. Does not replace a doctor." },
        { key:"alert",   title: "Emergency? Call 911", body: "If in immediate danger, call 911. Don't wait for SHC." },
        { key:"lock",    title: "Your privacy", body: "No personal records stored or shared." },
      ],
      consentLabel: "I understand SHC does not replace medical advice.",
      startBtn: "Start",
      back: "Back",
    },
    tr: {
      proceed: "Devam",
      infoTitle: "Başlamadan önce",
      bullets: [
        { key:"science", title: "Kanıta dayalı", body: "70+ klinik örüntü · ADA · AHA · NICE · WHO." },
        { key:"medical", title: "Tanı koymaz", body: "Karar destek aracıdır. Doktorun yerini almaz." },
        { key:"alert",   title: "Acil mi? Hemen 112", body: "Hayati tehlike varsa bu aracı beklemeyin, 112'yi arayın." },
        { key:"lock",    title: "Gizliliğiniz", body: "Bireysel kaydınız saklanmaz veya paylaşılmaz." },
      ],
      consentLabel: "SHC'nin tıbbi tavsiye niteliği taşımadığını anlıyorum.",
      startBtn: "Başla",
      back: "Geri",
    }
  };

  if (step === "lang") {
    return (
      <div className="onboarding-shell" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100dvh",overflowY:"auto",background:bg,fontFamily:SF,WebkitFontSmoothing:"antialiased",position:"relative"}}>
        <button className="onboarding-theme-control" onClick={()=>setDark((v: boolean)=>!v)} style={{position:"absolute",top:16,left:16,width:36,height:36,borderRadius:"50%",border:"none",background:"transparent",color:txt3,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
          {dark
            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
          }
        </button>
        <div className="onboarding-card" style={{display:"flex",flexDirection:"column",alignItems:"center",gap:0,width:"100%",maxWidth:330,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:40}}>
            <div style={{width:56,height:56,borderRadius:14,background:txt,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px"}}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={bg} strokeWidth="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
            <div style={{fontSize:22,fontWeight:600,color:txt,letterSpacing:"-0.03em",marginBottom:6}}>SHC</div>
            <div style={{fontSize:12,color:txt3,letterSpacing:"-0.01em"}}>Select Language / Dil Seçin</div>
          </div>
          <div style={{display:"flex",gap:12,marginBottom:40}}>
            {([{code:"en",label:"English",sub:"EN"},{code:"tr",label:"Türkçe",sub:"TR"}] satisfies LangOption[]).map((l) =>(
              <button key={l.code} onClick={()=>setSelected(l.code)} style={{
                padding:"18px 36px",borderRadius:14,
                background:selected===l.code?txt:bg2,
                border:"none",
                color:selected===l.code?bg:txt,
                cursor:"pointer",fontFamily:SF,fontSize:13,fontWeight:500,
                display:"flex",flexDirection:"column",alignItems:"center",gap:6,
                transition:"all 0.2s",letterSpacing:"-0.01em",
              }}>
                <span style={{fontSize:11,fontWeight:600,letterSpacing:"0.04em",opacity:0.5}}>{l.sub}</span>
                <span>{l.label}</span>
              </button>
            ))}
          </div>
          <div style={{height:50,display:"flex",alignItems:"center",justifyContent:"center"}}>
            {selected&&(
              <button onClick={()=>setStep("mode")} style={{padding:"13px 40px",borderRadius:12,background:txt,border:"none",color:bg,cursor:"pointer",fontFamily:SF,fontSize:13,fontWeight:400,letterSpacing:"-0.01em",transition:"opacity 0.15s"}}
                onMouseEnter={e=>e.currentTarget.style.opacity="0.85"}
                onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                {content[selected as Lang].proceed}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const c = content[selected as Lang];

  const DarkToggle = () => (
    <button onClick={()=>setDark((v: boolean)=>!v)} style={{width:36,height:36,borderRadius:"50%",border:"none",background:"transparent",color:txt3,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
      {dark
        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
      }
    </button>
  );

  if (step === "mode") {
    const modeOpts: ModeOption[] = selected === "tr" ? [
      { code:"online",  label:"Çevrimiçi",   sub:"Yapay zeka destekli örüntü analizi ve diferansiyel tanı",  color:"#0071e3" },
      { code:"offline", label:"Çevrimdışı",  sub:"İnternet gerektirmez · Soru-cevap tabanlı örüntü analizi", color:"#8e8e93" },
    ] : [
      { code:"online",  label:"Online",      sub:"AI-powered pattern analysis and differential diagnosis",   color:"#0071e3" },
      { code:"offline", label:"Offline",     sub:"No internet · Question-based pattern analysis",            color:"#8e8e93" },
    ];
    return (
      <div className="onboarding-shell" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100dvh",overflowY:"auto",background:bg,fontFamily:SF,WebkitFontSmoothing:"antialiased",position:"relative"}}>
        <div className="onboarding-theme-control" style={{position:"absolute",top:16,left:16}}><DarkToggle/></div>
        <div className="onboarding-card" style={{display:"flex",flexDirection:"column",alignItems:"center",width:"100%",maxWidth:330,margin:"0 auto",padding:"0 20px",boxSizing:"border-box"}}>
          <div style={{textAlign:"center",marginBottom:40}}>
            <div style={{width:56,height:56,borderRadius:14,background:txt,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px"}}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={bg} strokeWidth="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
            <div style={{fontSize:22,fontWeight:600,color:txt,letterSpacing:"-0.03em",marginBottom:6}}>
              {selected==="tr" ? "Mod Seçin" : "Select Mode"}
            </div>
            <div style={{fontSize:11,color:txt3,letterSpacing:"-0.01em"}}>
              {selected==="tr" ? "İnternet bağlantınıza göre seçin" : "Choose based on your connectivity"}
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10,width:"100%",maxWidth:300,margin:"0 auto 32px"}}>
            {modeOpts.map((m) =>(
              <button key={m.code} onClick={()=>setSelectedMode(m.code)} style={{
                display:"flex",alignItems:"center",gap:14,padding:"16px 18px",
                borderRadius:14,border:`1.5px solid ${selectedMode===m.code?m.color:sep}`,
                background:selectedMode===m.code?(dark?"rgba(255,255,255,0.05)":bg2):bg,
                cursor:"pointer",fontFamily:SF,textAlign:"left",transition:"all 0.15s",
              }}>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:500,color:txt,letterSpacing:"-0.02em"}}>{m.label}</div>
                  <div style={{fontSize:11,color:txt3,marginTop:2,letterSpacing:"-0.01em"}}>{m.sub}</div>
                </div>
                {selectedMode===m.code&&<div style={{width:18,height:18,borderRadius:"50%",background:m.color,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>}
              </button>
            ))}
          </div>
          <div style={{display:"flex",gap:10,width:"100%"}}>
            <button onClick={()=>setStep("lang")} style={{flex:1,padding:"13px",borderRadius:10,background:bg2,border:"none",color:txt,cursor:"pointer",fontFamily:SF,fontSize:12}}>
              {selected==="tr"?"Geri":"Back"}
            </button>
            <button onClick={()=>selectedMode&&setStep("info")} style={{flex:3,padding:"13px",borderRadius:10,background:selectedMode?txt:bg2,border:"none",color:selectedMode?bg:txt3,cursor:selectedMode?"pointer":"default",fontFamily:SF,fontSize:12,transition:"all 0.2s"}}>
              {selected==="tr"?"Devam":"Continue"}
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="onboarding-shell" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100dvh",overflowY:"auto",background:bg,padding:"20px",fontFamily:SF,WebkitFontSmoothing:"antialiased",position:"relative"}}>
      <div className="onboarding-theme-control" style={{position:"absolute",top:16,left:16}}><DarkToggle/></div>
      <div className="onboarding-card" style={{display:"flex",flexDirection:"column",alignItems:"center",width:"100%",maxWidth:330,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:40}}>
          <div style={{width:56,height:56,borderRadius:14,background:txt,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px"}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={bg} strokeWidth="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <div style={{fontSize:22,fontWeight:600,color:txt,letterSpacing:"-0.03em"}}>{c.infoTitle}</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:0,marginBottom:12,border:`1px solid ${sep}`,borderRadius:12,overflow:"hidden",background:bg}}>
          {c.bullets.map((b: InfoBullet,i: number)=>{
            const iconMap: Record<InfoBullet["key"], { path: ReactNode }> = {
              science: {path:<><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></>},
              medical: {path:<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>},
              alert:   {path:<><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></>},
              lock:    {path:<><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>},
            };
            const ic = iconMap[b.key];
            return (
              <div key={i} style={{padding:"10px 14px",display:"flex",gap:10,alignItems:"center",borderBottom:i<c.bullets.length-1?`1px solid ${sep}`:"none"}}>
                <div style={{width:26,height:26,borderRadius:7,background:bg2,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={txt} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{ic.path}</svg>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <span style={{fontSize:11,fontWeight:500,color:txt,letterSpacing:"-0.01em"}}>{b.title} </span>
                  <span style={{fontSize:11,color:txt3,letterSpacing:"-0.01em"}}>{b.body}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div onClick={()=>setConsent((v: boolean)=>!v)} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",borderRadius:10,background:bg2,cursor:"pointer",marginBottom:12,transition:"background 0.15s",border:`1px solid ${sep}`,width:"100%",boxSizing:"border-box"}}
          onMouseEnter={e=>e.currentTarget.style.background=dark?"#48484a":"#efefef"}
          onMouseLeave={e=>e.currentTarget.style.background=bg2}>
          <div style={{width:18,height:18,borderRadius:5,background:consent?"#0071e3":bg,border:`1.5px solid ${consent?"#0071e3":sep}`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}>
            {consent&&<svg width="9" height="9" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </div>
          <div style={{fontSize:11,color:txt,lineHeight:1.4,letterSpacing:"-0.01em"}}>{c.consentLabel}</div>
        </div>
        <div style={{display:"flex",gap:10,width:"100%"}}>
          <button onClick={()=>{setStep("mode");setConsent(false);}} style={{flex:1,padding:"12px",borderRadius:10,background:bg2,border:"none",color:txt,cursor:"pointer",fontFamily:SF,fontSize:12,fontWeight:400,letterSpacing:"-0.01em"}}>
            {c.back}
          </button>
          <button onClick={()=>selected&&consent&&onStart(selected, selectedMode==="offline")} style={{flex:3,padding:"12px",borderRadius:10,background:consent?txt:bg2,border:"none",color:consent?bg:txt3,cursor:consent?"pointer":"default",fontFamily:SF,fontSize:12,fontWeight:400,letterSpacing:"-0.01em",transition:"all 0.2s"}}>
            {c.startBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
