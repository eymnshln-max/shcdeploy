import type { ChangeEvent, KeyboardEvent, RefObject } from "react";
import type { FollowUpItem, Lang, StateSetter, ThemeColors, TranslationPack, UiPhase } from "../types";

interface ChatInputProps {
  C: ThemeColors;
  SF: string;
  dark: boolean;
  lang: Lang;
  t: TranslationPack;
  uiPhase: UiPhase;
  offlineMode: boolean;
  followUpHistory: FollowUpItem[];
  input: string;
  setInput: StateSetter<string>;
  loading: boolean;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  chatFileRef: RefObject<HTMLInputElement | null>;
  handleFileUpload: (file: File, source: "chat" | "panel") => void | Promise<void>;
  handleKey: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  send: () => void | Promise<void>;
  speechAvailable: boolean;
  toggleListen: () => void;
  isListening: boolean;
}

export function ChatInput({
  C,
  SF,
  dark,
  lang,
  t,
  uiPhase,
  offlineMode,
  followUpHistory,
  input,
  setInput,
  loading,
  textareaRef,
  chatFileRef,
  handleFileUpload,
  handleKey,
  send,
  speechAvailable,
  toggleListen,
  isListening,
}: ChatInputProps) {
  const showDocumentUpload = !offlineMode && (uiPhase === "doc_upload" || uiPhase === "symptoms");

  return (
    <div className="chat-input-bar" style={{paddingTop:8,paddingLeft:16,paddingRight:16,paddingBottom:"max(12px, calc(env(safe-area-inset-bottom) - 6px))",background:C.surface,borderTop:`1px solid ${C.sep}`,flexShrink:0}}>
      <div style={{display:"flex",gap:8,alignItems:"flex-end",background:C.bg2,borderRadius:22,padding:"8px 8px 8px 16px",transition:"background 0.15s"}}
        onFocusCapture={e=>e.currentTarget.style.background=dark?"#48484a":"#efefef"}
        onBlurCapture={e=>e.currentTarget.style.background=C.bg2}>
        {showDocumentUpload && (
          <>
            <input ref={chatFileRef} type="file" accept=".pdf,.txt,.text,text/plain,application/pdf" style={{display:"none"}} onChange={(e: ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0]; e.target.value=""; if(f) handleFileUpload(f,"chat");}}/>
            <button onClick={()=>chatFileRef.current?.click()} disabled={loading} title={lang==="tr"?"Belge yükle":"Upload document"} style={{width:30,height:30,borderRadius:"50%",border:`1px solid ${C.sep}`,flexShrink:0,background:"transparent",color:C.text3,cursor:loading?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
            </button>
          </>
        )}
        <textarea ref={textareaRef} value={input}
          onChange={e=>{setInput(e.target.value);e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,100)+"px";}}
          onKeyDown={handleKey}
          placeholder={t.placeholder_symptom}
          rows={1}
          style={{flex:1,background:"transparent",border:"none",outline:"none",fontFamily:SF,fontSize:14,color:C.text,resize:"none",minHeight:26,maxHeight:100,lineHeight:1.45,padding:"1px 0",letterSpacing:"-0.01em",caretColor:C.accent}}/>
        {!offlineMode && speechAvailable && (
          <button onClick={toggleListen} disabled={loading} title={lang==="tr"?"Sesli giriş":"Voice input"} style={{width:30,height:30,borderRadius:"50%",border:"none",flexShrink:0,background:isListening?C.accent:"transparent",color:isListening?"white":C.text3,cursor:loading?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M19 10a7 7 0 01-14 0"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>
          </button>
        )}
        <button onClick={send} disabled={loading||!input.trim()} style={{
          width:30,height:30,borderRadius:"50%",border:"none",flexShrink:0,
          background:loading||!input.trim()?"transparent":C.accent,
          cursor:loading||!input.trim()?"default":"pointer",
          display:"flex",alignItems:"center",justifyContent:"center",
          transition:"all 0.15s",
          opacity:loading||!input.trim()?0:1,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" stroke="white" strokeWidth="2"/></svg>
        </button>
      </div>
      {uiPhase!=="profiling"&&followUpHistory.length===0&&<div style={{fontSize:10,color:C.text3,marginTop:6,paddingLeft:6,letterSpacing:"-0.01em"}}>{t.hint}</div>}
    </div>
  );
}
