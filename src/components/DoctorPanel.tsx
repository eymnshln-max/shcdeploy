import { buildQRPayload, qrMatrix } from "../utils/qr";
import { getRoutingTheme } from "../ui/theme";
import type {
  Abstention,
  Differential,
  Lang,
  MatchResult,
  PanelTab,
  PatientProfile,
  Routing,
  SprtViz,
  StateSetter,
  ThemeColors,
  TranslationPack,
} from "../types";

type RoutingTheme = ReturnType<typeof getRoutingTheme>[Routing];

interface DoctorPanelProps {
  doctorMode: boolean;
  C: ThemeColors;
  SF: string;
  dark: boolean;
  lang: Lang;
  t: TranslationPack;
  offlineMode: boolean;
  panelTab: PanelTab;
  setPanelTab: StateSetter<PanelTab>;
  profile: PatientProfile | null;
  routing: Routing | null;
  lambda: number | null;
  diffs: Differential[];
  matches: MatchResult[];
  doctorAlert: string | null;
  abstention: Abstention;
  sprtViz: SprtViz | null;
  symptomText: string;
  exportPDF: () => void;
}

export function DoctorPanel({
  doctorMode,
  C,
  SF,
  dark,
  lang,
  t,
  offlineMode,
  panelTab,
  setPanelTab,
  profile,
  routing,
  lambda,
  diffs,
  matches,
  doctorAlert,
  abstention,
  sprtViz,
  symptomText,
  exportPDF,
}: DoctorPanelProps) {
  if (!doctorMode) return null;
  const APPLE_ROUTING = getRoutingTheme(dark);
  const ar: RoutingTheme | null = routing ? APPLE_ROUTING[routing] : null;
  const rl = routing ? t.routing[routing] : null;
  const needlePct = lambda ? Math.min(Math.max((Math.log10(Math.max(lambda,0.001))+2)/4*100,2),98) : null;
  const needleColor = routing==="RED"?"#c0392b":routing==="GREEN"?"#1a7a3c":routing==="YELLOW"?"#a0522d":"#aeaeb2";

  return (

              <div className="doctor-panel" style={{flex:1,width:"100%",maxWidth:900,margin:"0 auto",background:C.bg2,display:"flex",flexDirection:"column",overflow:"hidden",fontSize:11}}>
                <div style={{display:"flex",background:C.surface,borderBottom:`1px solid ${C.sep}`,flexShrink:0}}>
                  {([{id:"result",label:t.tabResult},{id:"diff",label:t.tabDiff},...(!offlineMode?[{id:"system",label:t.tabEngine}]:[])] as { id: PanelTab; label: string }[]).map((tab) =>(
                    <button key={tab.id} onClick={()=>setPanelTab(tab.id)} style={{flex:1,padding:"10px 0",fontSize:10,fontWeight:500,letterSpacing:"-0.01em",border:"none",cursor:"pointer",background:"transparent",color:panelTab===tab.id?C.accent:C.text3,borderBottom:panelTab===tab.id?`1.5px solid ${C.accent}`:"1.5px solid transparent",transition:"all 0.15s",fontFamily:SF}}>{tab.label}</button>
                  ))}
                </div>
                <div className="doctor-scroll" style={{flex:1,overflowY:"auto",padding:"16px 14px"}}>

                  {panelTab==="result"&&<>
                    {profile&&(
                      <div style={{marginBottom:16}}>
                        <div style={{fontSize:9,fontWeight:500,color:C.text3,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.06em"}}>{t.patientLabel}</div>
                        <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                          {[profile.age&&`${profile.age}y`,profile.sex&&(profile.sex==="female"?(lang==="tr"?"K":"F"):(lang==="tr"?"E":"M")),profile.bmi&&`BMI ${profile.bmi.toFixed(0)}`,profile.smoking&&(lang==="tr"?"Sigara":"Smoker"),profile.diabetes&&"DM",profile.hypertension&&"HTN",profile.familyHistory&&"FHx"].filter((chip): chip is string => Boolean(chip)).map((chip) =>(
                            <span key={chip} style={{background:C.bg2,borderRadius:5,padding:"2px 8px",fontSize:10,color:C.text,fontWeight:400,border:`1px solid ${C.sep}`}}>{chip}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{marginBottom:16}}>
                      <div style={{fontSize:9,fontWeight:500,color:C.text3,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.06em"}}>{t.triageLabel}</div>
                      {!routing || !ar || !rl ? (
                        <div style={{border:`1px solid ${C.sep}`,borderRadius:12,padding:"20px 14px",textAlign:"center",background:C.bg2}}>
                          <div style={{fontSize:11,color:C.text3,lineHeight:1.5}}>{t.awaiting}</div>
                        </div>
                      ):(
                        <div style={{border:`1px solid ${ar.border}`,borderRadius:12,background:ar.bg,padding:"16px 14px",textAlign:"center"}}>
                          <div style={{width:8,height:8,borderRadius:"50%",background:ar.dot,margin:"0 auto 10px",boxShadow:`0 0 0 3px ${ar.border}`}}/>
                          <div style={{fontSize:12,fontWeight:600,color:ar.color,lineHeight:1.3,marginBottom:4,letterSpacing:"-0.02em"}}>{rl.label}</div>
                          {lambda&&<div style={{fontSize:9,color:C.text3,marginTop:8,fontFamily:"'SF Mono','Menlo',monospace"}}>Î» = {lambda.toFixed(3)}</div>}
                        </div>
                      )}
                      {routing&&(()=>{
                        // Karar Ã¶zeti QR'Ä± â€” hasta doktoruna gÃ¶sterir / ekran fotosu / indirir. TÃ¼m veri kodun iÃ§inde.
                        const reason = (() => {
                          const top = diffs && diffs[0];
                          if (routing==="RED") return lang==="tr"?"Acil bulgu / kritik ayÄ±rÄ±cÄ± dÄ±ÅŸlanamadÄ±":"Emergent finding / critical differential not excluded";
                          if (routing==="GREY") return lang==="tr"?"Ã–rÃ¼ntÃ¼ belirsiz â€” deÄŸerlendirme gerekli":"Pattern unclear â€” evaluation needed";
                          return top ? (lang==="tr"?`OlasÄ±: ${top.name}`:`Likely: ${top.name}`) : (lang==="tr"?"Ã–rÃ¼ntÃ¼ deÄŸerlendirildi":"Pattern assessed");
                        })();
                        const sxList = symptomText
                          ? symptomText.toLowerCase().split(/[\s,.;]+/).filter(Boolean).slice(0,10)
                          : (diffs&&diffs[0]?[diffs[0].name]:[]);
                        const payload = buildQRPayload(routing, sxList, lambda, reason, lang, doctorAlert, diffs, sprtViz);
                        let mat; try { mat = qrMatrix(payload); } catch(e){ return null; }
                        const N = mat.length, quiet = 4, dim = N + quiet*2, px = 8;
                        const W = dim*px;
                        const darkPath = mat.flatMap((row,r)=>row.map((v,c)=>v?`M${(c+quiet)*px} ${(r+quiet)*px}h${px}v${px}h-${px}z`:"")).filter(Boolean).join("");
                        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${W}" viewBox="0 0 ${W} ${W}"><rect width="${W}" height="${W}" fill="#fff"/><path d="${darkPath}" fill="#000"/></svg>`;
                        const dataUrl = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
                        return (
                          <div style={{marginTop:10,padding:"12px",borderRadius:12,border:`1px solid ${C.sep}`,background:C.bg2,textAlign:"center"}}>
                            <div style={{fontSize:11,fontWeight:600,color:C.text,marginBottom:10,letterSpacing:"-0.01em"}}>{t.qrLabel}</div>
                            <div style={{display:"inline-block",padding:12,background:"#fff",borderRadius:14,boxShadow:dark?"0 2px 12px rgba(0,0,0,0.4)":"0 1px 4px rgba(0,0,0,0.08)"}}>
                              <img src={dataUrl} alt="QR" style={{display:"block",width:"min(82vw, 340px)",height:"auto",imageRendering:"pixelated"}}/>
                            </div>
                          </div>
                        );
                      })()}
                      {routing&&!offlineMode&&(
                        <button onClick={exportPDF} style={{marginTop:8,width:"100%",padding:"9px 0",borderRadius:8,border:`1px solid ${C.sep}`,background:C.bg2,color:C.text3,cursor:"pointer",fontFamily:"inherit",fontSize:11,fontWeight:500,display:"flex",alignItems:"center",justifyContent:"center",gap:6,transition:"all 0.2s",letterSpacing:"-0.01em"}}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                          {lang==="tr"?"PDF Raporu Ä°ndir":"Download PDF Report"}
                        </button>
                      )}
                    </div>

                    <div style={{marginBottom:16}}>
                      <div style={{fontSize:9,fontWeight:500,color:C.text3,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.06em"}}>{t.sprtLabel}</div>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:9,marginBottom:5,color:C.text3}}><span style={{color:C.text3}}>{t.safe}</span><span style={{color:C.text3}}>{t.critical}</span></div>
                      <div style={{height:4,borderRadius:4,position:"relative",overflow:"visible",background:"linear-gradient(to right,rgba(26,122,60,0.25),rgba(160,82,45,0.2),rgba(192,57,43,0.3))",border:`1px solid ${C.sep}`}}>
                        {needlePct!==null&&<div style={{position:"absolute",top:"50%",transform:"translate(-50%,-50%)",left:needlePct+"%",width:3,height:14,borderRadius:2,background:needleColor,transition:"left 0.9s cubic-bezier(0.34,1.56,0.64,1)"}}/>}
                      </div>
                      <div style={{textAlign:"center",fontFamily:"'SF Mono','Menlo',monospace",fontSize:9,color:C.text3,marginTop:5}}>{lambda?`Î» = ${lambda.toFixed(3)}`:"â€”"}</div>
                      {(() => {
                        const viz = sprtViz;
                        if (!viz?.traj || viz.traj.length <= 1 || viz.A == null || viz.B == null || viz.S == null) return null;
                        const A = viz.A, B = viz.B, pts = viz.traj;
                        const W = 260, H = 92, PAD = 8;
                        const yOf = (s: number) => { const c = Math.max(-4.2, Math.min(4.2, s)); return H/2 - (c/4.2)*(H/2 - PAD); };
                        const xOf = (idx: number) => PAD + (idx/(Math.max(pts.length-1,1)))*(W-2*PAD);
                        const dPath = pts.map((p,idx)=>`${idx===0?"M":"L"}${xOf(idx).toFixed(1)},${yOf(p.S).toFixed(1)}`).join(" ");
                        return (
                          <div style={{marginTop:10}}>
                            <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:"block",background:C.bg2,border:`1px solid ${C.sep}`,borderRadius:8}}>
                              <line x1={PAD} x2={W-PAD} y1={yOf(B)} y2={yOf(B)} stroke="#c0392b" strokeWidth="1" strokeDasharray="4 3" opacity="0.7"/>
                              <line x1={PAD} x2={W-PAD} y1={yOf(A)} y2={yOf(A)} stroke="#1a7a3c" strokeWidth="1" strokeDasharray="4 3" opacity="0.7"/>
                              <line x1={PAD} x2={W-PAD} y1={yOf(0)} y2={yOf(0)} stroke={C.text3} strokeWidth="0.5" opacity="0.25"/>
                              <path d={dPath} fill="none" stroke={needleColor} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"/>
                              {pts.map((p,idx)=>(<circle key={idx} cx={xOf(idx)} cy={yOf(p.S)} r="2" fill={needleColor}/>))}
                              <text x={W-PAD} y={yOf(B)-3} textAnchor="end" fontSize="7" fill="#c0392b" fontFamily="monospace">b=+{B.toFixed(2)}</text>
                              <text x={W-PAD} y={yOf(A)+9} textAnchor="end" fontSize="7" fill="#1a7a3c" fontFamily="monospace">a={A.toFixed(2)}</text>
                            </svg>
                            <div style={{textAlign:"center",fontFamily:"'SF Mono','Menlo',monospace",fontSize:9,color:C.text3,marginTop:5}}>
                              Sâ‚™ â€” {viz.topKey} Â· S = {viz.S.toFixed(2)}{viz.abstained ? (lang==="tr"?" Â· Ã‡EKÄ°MSER":" Â· ABSTAIN") : ""}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {doctorAlert&&(
                      <div style={{marginBottom:16}}>
                        <div style={{fontSize:9,fontWeight:500,color:C.text3,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.06em"}}>{t.alertLabel}</div>
                        <div style={{background:C.bg2,border:`1px solid ${C.sep}`,borderRadius:10,padding:"10px 12px",fontSize:11,color:C.text,lineHeight:1.6,borderLeft:`3px solid ${C.sep}`}}>
                          {doctorAlert}
                        </div>
                      </div>
                    )}

                    <div>
                      <div style={{fontSize:9,fontWeight:500,color:C.text3,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.06em"}}>{t.uncertaintyLabel}</div>
                      {t.uFlags.map(({k,label})=>{
                        const on=!!abstention[k];
                        return(
                          <div key={k} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:`1px solid ${C.sep}`}}>
                            <div style={{width:5,height:5,borderRadius:"50%",flexShrink:0,background:on?C.text:"rgba(128,128,128,0.2)"}}/>
                            <div style={{fontSize:11,color:on?C.text:C.text3,flex:1,letterSpacing:"-0.01em"}}>{label}</div>
                            {on&&<div style={{fontSize:9,color:C.text3,fontWeight:500}}>{lang==="tr"?"aktif":"active"}</div>}
                          </div>
                        );
                      })}
                    </div>
                  </>}

                  {panelTab==="diff"&&<>
                    <div style={{fontSize:9,fontWeight:500,color:C.text3,marginBottom:14,textTransform:"uppercase",letterSpacing:"0.06em"}}>{t.diffLabel}</div>
                    {diffs.length===0?(
                      <div style={{fontSize:11,color:C.text3,textAlign:"center",padding:"32px 0",lineHeight:1.6,whiteSpace:"pre-line"}}>{t.diffEmpty}</div>
                    ):diffs.slice(0,6).map((d,i)=>{
                      return(
                        <div key={i} style={{marginBottom:16,paddingBottom:16,borderBottom:`1px solid ${C.sep}`}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6}}>
                            <div style={{fontSize:11,fontWeight:500,color:C.text,letterSpacing:"-0.01em"}}>{d.name}</div>
                            <div style={{fontSize:11,fontWeight:500,color:C.text,fontFamily:"'SF Mono','Menlo',monospace"}}>{d.pct}%</div>
                          </div>
                          <div style={{height:2,background:C.sep,borderRadius:2,overflow:"hidden"}}>
                            <div style={{height:"100%",width:d.pct+"%",background:C.text,borderRadius:2,transition:"width 0.9s ease"}}/>
                          </div>
                          <div style={{display:"flex",justifyContent:"space-between",marginTop:5}}><span style={{fontSize:9,color:C.text3,textTransform:"capitalize"}}>{d.risk}</span>{d.source&&<span style={{fontSize:8,color:C.text3,opacity:0.7}}>{d.source}</span>}</div>
                        </div>
                      );
                    })}
                  </>}

                  {panelTab==="system"&&<>
                    <div style={{fontSize:9,fontWeight:500,color:C.text3,marginBottom:14,textTransform:"uppercase",letterSpacing:"0.06em"}}>{t.engineLabel}</div>
                    {matches.length===0?(
                      <div style={{fontSize:11,color:C.text3,textAlign:"center",padding:"32px 0",lineHeight:1.6,whiteSpace:"pre-line"}}>{t.engineEmpty}</div>
                    ):matches.slice(0,5).map((m,i)=>(
                      <div key={i} style={{marginBottom:10,padding:"10px 12px",background:C.bg2,border:`1px solid ${C.sep}`,borderRadius:10}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                          <div style={{fontSize:11,fontWeight:500,color:C.text,letterSpacing:"-0.01em"}}>{m.name}</div>
                          {m.confirmatoryMet&&<span style={{fontSize:8,color:C.text3,fontWeight:500,letterSpacing:"0.02em"}}>CONF</span>}
                        </div>
                        <div style={{fontSize:9,color:C.text3,fontFamily:"'SF Mono','Menlo',monospace"}}>{m.triggerHits} hits Â· LR {m.sprt_lr} Â· Ã—{(m.profileMod ?? 1).toFixed(1)}</div>
                        <div style={{fontSize:9,color:C.text3,marginTop:2}}>ICD {m.icd}</div>
                      </div>
                    ))}
                    <div style={{marginTop:12,padding:"10px 12px",background:C.bg2,borderRadius:10,border:`1px solid ${C.sep}`}}>
                      <div style={{fontSize:9,fontWeight:500,color:C.text3,marginBottom:5,textTransform:"uppercase",letterSpacing:"0.06em"}}>{t.sourcesLabel}</div>
                      <div style={{fontSize:10,color:C.text3,lineHeight:1.8,letterSpacing:"-0.01em"}}>ADA 2025 Â· AHA/ACC Â· EULAR/ACR<br/>GINA Â· GOLD Â· MDS Â· NICE NG240<br/>USPSTF Â· WHO Â· ESC Â· IDSA</div>
                    </div>
                  </>}
                </div>
              </div>
  );
}

