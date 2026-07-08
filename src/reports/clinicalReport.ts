import type { ChatHistoryItem, Differential, Lang, MatchResult, PatientProfile, Routing } from "../types";

interface ExportClinicalReportPDFArgs {
lang: Lang | null;
routing: Routing | null;
profile: PatientProfile | null;
diffs: Differential[];
matches: MatchResult[];
history: ChatHistoryItem[];
docSummary: string;
doctorAlert: string | null;
urgency: string | null;
lambda: number | null;
routingLabel: { label?: string; sub?: string } | null;
offlineMode: boolean;
}

export function exportClinicalReportPDF({
lang,
routing,
profile,
diffs,
matches,
history,
docSummary,
doctorAlert,
urgency,
lambda,
routingLabel,
offlineMode,
}: ExportClinicalReportPDFArgs) {
  const now = new Date();
  const dateStr = now.toLocaleString(lang==="tr"?"tr-TR":"en-GB");
  const tr = lang==="tr";
const rl = routingLabel;
  const routingColor = routing==="RED"?"#c0392b":routing==="GREEN"?"#1a7a3c":routing==="YELLOW"?"#92400e":"#555";
  const routingBg   = routing==="RED"?"#fef2f2":routing==="GREEN"?"#f0fdf4":routing==="YELLOW"?"#fffbeb":"#f9f9f9";
  const profileStr  = profile ? [
    profile.age   && (tr?`Yaş: ${profile.age}`:`Age: ${profile.age}`),
    profile.sex   && (tr?`Cinsiyet: ${profile.sex==="female"?"Kadın":"Erkek"}`:`Sex: ${profile.sex}`),
    profile.bmi   && `BMI: ${profile.bmi.toFixed(1)}`,
    profile.smoking    && (tr?"Sigara: Evet":"Smoking: Yes"),
    profile.diabetes   && (tr?"Diyabet: Evet":"Diabetes: Yes"),
    profile.hypertension && (tr?"Hipertansiyon: Evet":"Hypertension: Yes"),
    profile.familyHistory && (tr?"Aile Geçmişi: Evet":"Family History: Yes"),
  ].filter(Boolean).join("  ·  ") : "—";

  const diffsHTML = diffs.length>0 ? diffs.slice(0,6).map(d=>{
    const riskColor = d.risk==="critical"?"#c0392b":d.risk==="high"?"#d35400":d.risk==="moderate"?"#92400e":"#1a7a3c";
    return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #f0f0f0">
      <div style="flex:1">
        <span style="font-weight:600;color:#111;font-size:11px">${d.name}</span>
        ${d.source?`<span style="color:#aaa;font-size:10px;margin-left:6px">${d.source}</span>`:""}
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <div style="width:80px;height:4px;background:#eee;border-radius:4px;overflow:hidden">
          <div style="height:100%;width:${d.pct}%;background:${riskColor};border-radius:4px"></div>
        </div>
        <span style="font-size:11px;font-weight:600;color:${riskColor};min-width:32px;text-align:right">${d.pct}%</span>
        <span style="font-size:9px;color:#999;text-transform:uppercase;letter-spacing:0.05em;min-width:56px">${d.risk}</span>
      </div>
    </div>`;
  }).join("") : `<p style="color:#aaa;font-size:11px">${tr?"Mevcut değil":"Not available"}</p>`;

  const matchesHTML = matches.length>0 ? matches.slice(0,6).map(m=>`
    <div style="background:#fafafa;border:1px solid #eee;border-radius:8px;padding:10px 14px;margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
        <span style="font-weight:600;font-size:11px;color:#111">${m.name}</span>
        <span style="font-size:9px;color:#999">ICD ${m.icd}</span>
      </div>
      <div style="font-size:10px;color:#777;font-family:monospace">${m.triggerHits} hits · LR ${m.sprt_lr} · ×${(m.profileMod ?? 1).toFixed(1)}${m.confirmatoryMet?" · <b style='color:#1a7a3c'>CONF</b>":""}</div>
    </div>`).join("") : `<p style="color:#aaa;font-size:11px">${tr?"Mevcut değil":"Not available"}</p>`;

  const convoHTML = history.map(m=>{
    const isUser = m.role==="user";
    return `<div style="margin-bottom:12px">
      <div style="font-size:9px;font-weight:600;color:${isUser?"#1a7a3c":"#1F3864"};text-transform:uppercase;letter-spacing:0.06em;margin-bottom:3px">${isUser?(tr?"Hasta":"Patient"):"SHC"}</div>
      <div style="font-size:11px;color:#333;line-height:1.6;background:${isUser?"#f8fffe":"#f5f7ff"};border-radius:8px;padding:10px 12px;border-left:3px solid ${isUser?"#1a7a3c":"#1F3864"}">${m.content.replace(/\n/g,"<br>")}</div>
    </div>`;
  }).join("");

  const docSummaryHTML = docSummary ? `
    <div style="margin-top:24px">
      <h2 style="font-size:10px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 12px">${tr?"Yüklenen Belgeler":"Uploaded Documents"}</h2>
      <div style="background:#fffef0;border:1px solid #e8e0a0;border-radius:10px;padding:14px 16px;font-size:11px;color:#444;line-height:1.7;white-space:pre-wrap">${docSummary}</div>
    </div>` : "";

  const html = `<!DOCTYPE html><html lang="${lang}"><head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>SHC Clinical Report — ${dateStr}</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;background:#fff;color:#111;font-size:12px;line-height:1.5}
      @media print{body{padding:0}.no-print{display:none!important}@page{margin:20mm 18mm}}
    </style>
  </head><body style="padding:32px 36px;max-width:800px;margin:0 auto">

    <!-- HEADER -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:20px;border-bottom:2px solid #1F3864">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
          <div style="width:32px;height:32px;border-radius:8px;background:#1F3864;display:flex;align-items:center;justify-content:center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <div>
            <div style="font-size:15px;font-weight:700;color:#1F3864;letter-spacing:-0.02em">SHC</div>
            <div style="font-size:10px;color:#888">Standard HealthCare</div>
          </div>
        </div>
      </div>
      <div style="text-align:right">
        <div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.05em">${tr?"Rapor Tarihi":"Report Date"}</div>
        <div style="font-size:11px;font-weight:600;color:#333;margin-top:2px">${dateStr}</div>
        <div style="margin-top:8px;display:inline-block;padding:3px 10px;background:#fee2e2;border-radius:20px;font-size:9px;font-weight:700;color:#991b1b;letter-spacing:0.05em">${tr?"TANIM YERİNE GEÇMEZ":"NOT A DIAGNOSIS"}</div>
      </div>
    </div>

    <!-- PATIENT + TRIAGE ROW -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px">
      <div style="background:#f8f9fc;border-radius:10px;padding:16px">
        <div style="font-size:9px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px">${tr?"Hasta Profili":"Patient Profile"}</div>
        <div style="font-size:11px;color:#333;line-height:1.8">${profileStr.split("  ·  ").map(s=>`<div>${s}</div>`).join("")}</div>
      </div>
      <div style="background:${routingBg};border:2px solid ${routingColor}22;border-radius:10px;padding:16px;text-align:center;display:flex;flex-direction:column;justify-content:center">
        <div style="font-size:9px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:10px">${tr?"Triyaj Sonucu":"Triage Result"}</div>
        <div style="font-size:19px;font-weight:700;color:${routingColor};letter-spacing:-0.02em;line-height:1.2">${rl?.label||"—"}</div>
        ${urgency?`<div style="margin-top:8px;font-size:11px;color:${routingColor};background:${routingColor}11;border-radius:6px;padding:6px 10px">${urgency}</div>`:""}
        <div style="margin-top:10px;font-size:10px;color:#aaa;font-family:monospace">λ = ${lambda?.toFixed(3)||"—"}</div>
      </div>
    </div>

    ${doctorAlert?`
    <div style="margin-bottom:24px;background:#fff8f0;border:1px solid #f5a623;border-radius:10px;padding:14px 16px">
      <div style="font-size:9px;font-weight:700;color:#d97706;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px">${tr?"Doktor Notu":"Doctor Note"}</div>
      <div style="font-size:11px;color:#333;line-height:1.6">${doctorAlert}</div>
    </div>`:""}

    <!-- DIFFERENTIALS -->
    <div style="margin-bottom:24px">
      <h2 style="font-size:10px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px">${tr?"Olası Tanılar":"Differential Diagnoses"}</h2>
      ${diffsHTML}
    </div>

    <!-- PATTERN ENGINE -->
    ${!offlineMode?`
    <div style="margin-bottom:24px">
      <h2 style="font-size:10px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px">${tr?"Analiz Motoru — Pattern Eşleşmeleri":"Pattern Engine — Matches"}</h2>
      ${matchesHTML}
    </div>`:""}

    ${docSummaryHTML}

    <!-- FOOTER -->
    <div style="border-top:1px solid #eee;padding-top:16px;display:flex;justify-content:space-between;align-items:center">
      <div style="font-size:9px;color:#bbb">SHC · Standard HealthCare · ${dateStr}</div>
      <div style="font-size:9px;color:#bbb">${tr?"Bu rapor karar destek aracı çıktısıdır. Tanı yerine geçmez.":"This report is the output of a decision support tool. Not a clinical diagnosis."}</div>
    </div>

    <script>window.onload=()=>window.print();<\/script>
  </body></html>`;

  const w = window.open("","_blank","width=900,height=700");
  if (w) { w.document.write(html); w.document.close(); }
}
