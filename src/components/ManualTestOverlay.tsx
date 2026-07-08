interface ManualTestOverlayProps {
  visible: boolean;
  onlineTestError: string | null;
}

export function ManualTestOverlay({ visible, onlineTestError }: ManualTestOverlayProps) {
  if (!visible || !onlineTestError) return null;

  return (
    <div role="alert" style={{position:"fixed",inset:0,zIndex:2147483646,display:"grid",placeItems:"center",padding:24,background:"rgba(10,10,10,.96)",color:"#fff",textAlign:"center"}}>
      <div style={{maxWidth:680}}>
        <h1 style={{fontSize:24,margin:"0 0 12px"}}>ONLINE TEST DURDURULDU</h1>
        <p style={{fontSize:15,lineHeight:1.55,margin:0}}>{onlineTestError}</p>
        <p style={{fontSize:12,opacity:.65,marginTop:10}}>Offline fallback kullanılmadı. Bu vaka INVALID olarak kaydedilmeli.</p>
      </div>
    </div>
  );
}
