import type { Message, ThemeColors } from "../types";

interface MessageBubbleProps {
  msg: Message;
  C: ThemeColors;
  SF: string;
  dark: boolean;
}

interface LoadingBubbleProps {
  C: ThemeColors;
  dark: boolean;
}

export function MessageBubble({ msg, C, SF, dark }: MessageBubbleProps) {
  return (
    <div style={{display:"flex",justifyContent:msg.role==="user"?"flex-end":"flex-start",padding:"3px 20px",alignItems:"flex-end",gap:8}}>
      {msg.role!=="user"&&(
        <div style={{width:28,height:28,borderRadius:"50%",flexShrink:0,background:C.dot,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:2}}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={dark?"#1d1d1f":"white"} strokeWidth="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        </div>
      )}
      <div style={{
        maxWidth:"68%",
        background:msg.role==="user"?C.userBubble:C.shcBubble,
        color:msg.role==="user"?C.userText:C.shcText,
        borderRadius:msg.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px",
        padding:"11px 15px",
        fontSize:13,
        lineHeight:1.5,
        letterSpacing:"-0.01em",
        whiteSpace:"pre-wrap",
        fontFamily:SF,
      }}>
        {msg.text}
      </div>
    </div>
  );
}

export function LoadingBubble({ C, dark }: LoadingBubbleProps) {
  return (
    <div style={{display:"flex",padding:"3px 20px",alignItems:"flex-end",gap:8}}>
      <div style={{width:28,height:28,borderRadius:"50%",background:C.dot,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:2}}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={dark?"#1d1d1f":"white"} strokeWidth="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
      </div>
      <div style={{background:C.shcBubble,borderRadius:"18px 18px 18px 4px",padding:"14px 18px",display:"flex",gap:4,alignItems:"center"}}>
        {[0,1,2].map((j) =><div key={j} style={{width:6,height:6,borderRadius:"50%",background:C.text3,animation:`dotBounce 1.2s ${j*0.2}s infinite`}}/>)}
      </div>
    </div>
  );
}
