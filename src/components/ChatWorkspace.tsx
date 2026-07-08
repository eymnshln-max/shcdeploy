import type { KeyboardEvent, RefObject } from "react";
import type {
  AkinatorAnswer,
  AkinatorQuestion,
  FollowUpItem,
  Lang,
  Message,
  MessageRole,
  StateSetter,
  ThemeColors,
  TranslationPack,
  UiPhase,
} from "../types";
import { ChatInput } from "./ChatInput";
import { LoadingBubble, MessageBubble } from "./MessageBubble";
import { ProfilePrompt } from "./ProfilePrompt";
import { AkinatorPanel } from "./AkinatorPanel";

interface ChatWorkspaceProps {
  C: ThemeColors;
  SF: string;
  dark: boolean;
  lang: Lang;
  t: TranslationPack;
  doctorMode: boolean;
  offlineMode: boolean;
  uiPhase: UiPhase;
  loading: boolean;
  messages: Message[];
  scrollRef: RefObject<HTMLDivElement | null>;
  bottomRef: RefObject<HTMLDivElement | null>;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  chatFileRef: RefObject<HTMLInputElement | null>;
  input: string;
  setInput: StateSetter<string>;
  profileIdx: number;
  addMsg: (text: string, role?: MessageRole) => void;
  handleProfileAnswer: (text: string) => void | Promise<void>;
  akinatorGate: string | null;
  akinatorDone: boolean;
  akinatorCurrent: AkinatorQuestion | null;
  akinatorScale: number;
  setAkinatorScale: StateSetter<number>;
  handleGateSelect: (gateId: string) => void;
  handleAkinatorAnswer: (answer: AkinatorAnswer | "scale", value?: number) => void;
  followUpHistory: FollowUpItem[];
  handleFileUpload: (file: File, source: "chat" | "panel") => void | Promise<void>;
  handleKey: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  send: () => void | Promise<void>;
  speechAvailable: boolean;
  toggleListen: () => void;
  isListening: boolean;
}

export function ChatWorkspace({
  C,
  SF,
  dark,
  lang,
  t,
  doctorMode,
  offlineMode,
  uiPhase,
  loading,
  messages,
  scrollRef,
  bottomRef,
  textareaRef,
  chatFileRef,
  input,
  setInput,
  profileIdx,
  addMsg,
  handleProfileAnswer,
  akinatorGate,
  akinatorDone,
  akinatorCurrent,
  akinatorScale,
  setAkinatorScale,
  handleGateSelect,
  handleAkinatorAnswer,
  followUpHistory,
  handleFileUpload,
  handleKey,
  send,
  speechAvailable,
  toggleListen,
  isListening,
}: ChatWorkspaceProps) {
  const activeProfileQuestion = t.questions[profileIdx];
  const showChatInput =
    (uiPhase !== "profiling" ||
      !activeProfileQuestion ||
      (activeProfileQuestion.type !== "choice" && activeProfileQuestion.type !== "number")) &&
    !offlineMode;

  return (
    <div className="chat-workspace" style={{flex:1,display:doctorMode?"none":"flex",flexDirection:"column",overflow:"hidden",minWidth:0,background:C.bg}}>
      <div
        ref={scrollRef}
        className="chat-scroll"
        style={{flex:1,overflowY:"auto",padding:offlineMode?"24px 0 calc(env(safe-area-inset-bottom) + 20px)":"24px 0 12px",display:"flex",flexDirection:"column",gap:2,userSelect:"none"}}
        onClick={e=>{
          if(uiPhase!=="profiling" && textareaRef.current && e.target===e.currentTarget){
            textareaRef.current.focus();
          }
        }}
      >
        {messages.map((msg,i)=><MessageBubble key={i} msg={msg} C={C} SF={SF} dark={dark}/>)}
        {uiPhase==="profiling" && !loading && (
          <ProfilePrompt
            t={t}
            lang={lang}
            C={C}
            SF={SF}
            dark={dark}
            input={input}
            setInput={setInput}
            profileIdx={profileIdx}
            addMsg={addMsg}
            handleProfileAnswer={handleProfileAnswer}
          />
        )}
        <AkinatorPanel
          C={C}
          SF={SF}
          dark={dark}
          lang={lang}
          uiPhase={uiPhase}
          loading={loading}
          offlineMode={offlineMode}
          akinatorGate={akinatorGate}
          akinatorDone={akinatorDone}
          akinatorCurrent={akinatorCurrent}
          akinatorScale={akinatorScale}
          setAkinatorScale={setAkinatorScale}
          handleGateSelect={handleGateSelect}
          handleAkinatorAnswer={handleAkinatorAnswer}
        />
        {loading&&<LoadingBubble C={C} dark={dark}/>}
        <div ref={bottomRef}/>
      </div>

      {showChatInput && (
        <ChatInput
          C={C}
          SF={SF}
          dark={dark}
          lang={lang}
          t={t}
          uiPhase={uiPhase}
          offlineMode={offlineMode}
          followUpHistory={followUpHistory}
          input={input}
          setInput={setInput}
          loading={loading}
          textareaRef={textareaRef}
          chatFileRef={chatFileRef}
          handleFileUpload={handleFileUpload}
          handleKey={handleKey}
          send={send}
          speechAvailable={speechAvailable}
          toggleListen={toggleListen}
          isListening={isListening}
        />
      )}
    </div>
  );
}
