import type { ClinicalEngineResult, ClinicalPattern, PatternMap, Routing, SprtDecisionOptions, SprtPerPattern, SprtState, SprtTrajectoryPoint } from "../types";

export const SPRT_CFG = {
  ALPHA: 0.05,                       // max false-RED (Type I)
  BETA: 0.05,                        // max missed-emergency (Type II / FNR)
  B_UPPER: Math.log(0.95 / 0.05),    // ≈ +2.944 — confirm boundary (Wald b)
  A_LOWER: Math.log(0.05 / 0.95),    // ≈ −2.944 — exclude boundary (Wald a)
  PRIOR_CLAMP: 1.5,   // |S₀| ≤ 1.5: prior may nudge, never pre-decide
  MOD_CLAMP: 1.2,     // demographic multiplier contribution cap (log space)
  PREV_W: 0.25, PREV_REF: 5.0, PREV_CLAMP: 0.4,  // relative-prevalence term
  GATE_ON: Math.log(1.4), GATE_OFF: -Math.log(1.4), // gate prior shift
  LR_FLOOR: 1.3,      // floor for sprt_lr<1 patterns (anxiety 0.6 etc.)
  TRIG_W: 0.5,        // non-confirmatory present: y = 0.5·log(LR)
  LRM_CONF: 0.35,     // confirmatory ABSENT → LR⁻ (strong negative evidence)
  LRM_TRIG: 0.7,      // trigger ABSENT → LR⁻ (mild negative evidence)
  ABSTAIN_MARGIN: 0.8, // critical blocks GREEN unless S ≤ A_LOWER+margin
  LEAN_MIN: 1.0,      // unconfirmed lean → provisional routing if S ≥ 1.0
  LAMBDA_MIN: 0.012, LAMBDA_MAX: 95,
};
export const SPRT_SEV: Record<string, number> = { critical: 3, high: 2, moderate: 1, low: 0 };
export const SPRT_ROUTE_RANK: Record<string, number> = { RED: 3, GREY: 2, YELLOW: 1, GREEN: 0 };
export const sprtClamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
const toRouting = (value: string | undefined): Routing =>
  value === "RED" || value === "YELLOW" || value === "GREEN" || value === "GREY" ? value : "YELLOW";

// log-likelihood contribution of one symptom for one pattern
export function sprtSymptomY(pat: ClinicalPattern, trig: string, present: boolean, conf = 1): number {
  const ov = pat.lrOverrides?.[trig];
  let yh;
  if (ov) yh = Math.log(present ? (ov.plus || 1) : (ov.minus || 1));
  else {
    const base = Math.max(pat.sprt_lr || 1, SPRT_CFG.LR_FLOOR);
    const isConf = (pat.confirmatory || []).includes(trig);
    yh = present
      ? (isConf ? 1 : SPRT_CFG.TRIG_W) * Math.log(base)
      : Math.log(isConf ? SPRT_CFG.LRM_CONF : SPRT_CFG.LRM_TRIG);
  }
  // Soft evidence (Tez Bölüm 3.3): beklenen-LR altında entegrasyon.
  // LR_eff = c·e^{y} + (1−c)·1  →  y_soft = log(LR_eff).
  // c = ekstraktörün kalibre olasılığı; c=1 klasik (hard) SPRT'yi BİREBİR verir,
  // c→0 katkıyı sıfıra çeker (log 1 = 0). |y_soft| ≤ |y_hard| her zaman.
  const c = conf == null ? 1 : Math.max(0, Math.min(1, conf));
  if (c >= 1) return yh;
  return Math.log(c * Math.exp(yh) + (1 - c));
}

// clamped prior offset S₀ = demographics + relative prevalence + gate
export function sprtPrior(pat: ClinicalPattern, key: string, riskMods: Record<string, number | undefined>, gateBonus: string[]): number {
  const mod = riskMods?.[key] ?? 1.0;
  let s0 = sprtClamp(Math.log(Math.max(mod, 0.05)), -SPRT_CFG.MOD_CLAMP, SPRT_CFG.MOD_CLAMP);
  s0 += sprtClamp(SPRT_CFG.PREV_W * Math.log((pat.base_prevalence || 1) / SPRT_CFG.PREV_REF), -SPRT_CFG.PREV_CLAMP, SPRT_CFG.PREV_CLAMP);
  if (gateBonus && gateBonus.length > 0) s0 += gateBonus.includes(key) ? SPRT_CFG.GATE_ON : SPRT_CFG.GATE_OFF;
  return sprtClamp(s0, -SPRT_CFG.PRIOR_CLAMP, SPRT_CFG.PRIOR_CLAMP);
}

// run parallel SPRTs over patternKeys given present/absent trigger sets
export function runSPRT(patternKeys: string[], present: string[], absent: string[], riskMods: Record<string, number | undefined>, gateBonus: string[], PAT: PatternMap, confMap: Record<string, number> = {}): SprtState {
  // confMap: {trigger_id: P(present|anlatı)} — LLM'in kalibre olasılıkları (online).
  // Varlık kanalı c = p; yokluk kanalı c = 1−p (yokluk iddiasının gücü). Yoksa c=1.
  const cm: Record<string, number> | null = confMap || null;
  const per: Record<string, SprtPerPattern> = {};
  const presentSet = new Set(present);
  const absentSet = new Set((absent || []).filter((t: string) => !presentSet.has(t)));
  for (const key of patternKeys) {
    const pat = PAT[key];
    if (!pat) continue;
    const presRel = (pat.triggers || []).filter((t: string) => presentSet.has(t));
    const absRel = (pat.triggers || []).filter((t: string) => absentSet.has(t));
    const required = pat.required_any || [];
    const reqMet = required.length === 0 || required.some((r: string) => presentSet.has(r));
    const active = reqMet && presRel.length >= 1;
    if (!active) { per[key] = { active: false, status: "inactive", S: Number.NEGATIVE_INFINITY, s0: 0, traj: [], presRel: [], absRel: [], risk: pat.risk || "moderate" }; continue; }
    const s0 = sprtPrior(pat, key, riskMods, gateBonus);
    let S = s0;
    const traj: SprtTrajectoryPoint[] = [{ t: "prior", y: s0, S: s0 }];
    for (const t of presRel) { const c = cm && typeof cm[t] === "number" ? cm[t] : 1; const y = sprtSymptomY(pat, t, true, c); S += y; traj.push({ t, y, S, present: true }); }
    for (const t of absRel) { const c = cm && typeof cm[t] === "number" ? (1 - cm[t]) : 1; const y = sprtSymptomY(pat, t, false, c); S += y; traj.push({ t, y, S, present: false }); }
    const status = S >= SPRT_CFG.B_UPPER ? "confirmed" : S <= SPRT_CFG.A_LOWER ? "excluded" : "indeterminate";
    per[key] = { active: true, status, S, s0, traj, presRel, absRel, risk: pat.risk || "moderate" };
  }
  const byS = (st: string) => Object.keys(per).filter((k: string) => per[k].status === st)
    .sort((a, b) => (SPRT_SEV[per[b].risk] - SPRT_SEV[per[a].risk]) || (per[b].S - per[a].S));
  return { per, confirmed: byS("confirmed"), indeterminate: byS("indeterminate"), excluded: byS("excluded") };
}

// posterior-share differentials — geniş aday seti (en az 1 trigger eşleşen tüm hipotezler).
// routing kararından BAĞIMSIZ: yalnız doktor-modu tablosu için zengin ayırıcı tanı üretir.
export function sprtDiffs(sprt: SprtState, lang: string, PAT: PatternMap, namesTR: Record<string, string>, present: string[], absent: string[], riskMods: Record<string, number | undefined>, gateBonus: string[]) {
  const presentSet = new Set(present || []);
  const absentSet = new Set((absent || []).filter((t: string) => !presentSet.has(t)));
  // Önce runSPRT'nin tam aktif hipotezleri (confirmed/indeterminate skorlarıyla)
  const scored: Record<string, number> = {};
  for (const [k, v] of Object.entries(sprt.per)) {
    if (v.active && v.S != null) scored[k] = v.S;
  }
  // Sonra: aktif sayılmayan ama ≥1 trigger eşleşen hipotezleri de aday olarak ekle (gevşek skor).
  // Bu yalnız tablo için; required_any karşılanmadıysa hafif ceza ile dahil edilir.
  const candidateKeys = gateBonus && gateBonus.length
    ? [...new Set([...gateBonus, ...Object.keys(scored)])]
    : Object.keys(PAT);
  for (const k of candidateKeys) {
    if (scored[k] != null) continue;
    const pat = PAT[k]; if (!pat) continue;
    const presRel = (pat.triggers || []).filter((t: string) => presentSet.has(t));
    if (presRel.length < 1) continue;
    const required = pat.required_any || [];
    const reqMet = required.length === 0 || required.some((r: string) => presentSet.has(r));
    let s = sprtPrior(pat, k, riskMods || {}, gateBonus || []);
    for (const t of presRel) s += sprtSymptomY(pat, t, true, 1);
    for (const t of (pat.triggers || []).filter((t: string) => absentSet.has(t))) s += sprtSymptomY(pat, t, false, 1);
    if (!reqMet) s -= 0.7; // required_any yoksa hafif indirim (aday kalır ama geride)
    scored[k] = s;
  }
  const entries = Object.entries(scored);
  if (entries.length === 0) return [];
  const tot = entries.reduce((acc, [, s]) => acc + Math.exp(s), 0) || 1;
  return entries
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([k, s]) => ({
      name: lang === "tr" ? (namesTR[k] || PAT[k]?.name || k) : (PAT[k]?.name || k),
      pct: Math.round((Math.exp(s) / tot) * 1000) / 10,  // küsuratlı: 85.3 gibi
      risk: PAT[k]?.risk || "moderate",
      source: PAT[k]?.source || "",
    }));
}

// compact doctor-mode narrative of the decision statistic
export function sprtNarrative(key: string, c: SprtPerPattern): string {
  if (!c || !c.traj) return "";
  const terms = c.traj.slice(1, 7).map((s) => `${s.present ? "+" : "−"}${s.t} ${s.y >= 0 ? "+" : ""}${s.y.toFixed(2)}`).join(" · ");
  const more = c.traj.length > 7 ? " · …" : "";
  return `[SPRT] ${key}: S₀=${c.s0 >= 0 ? "+" : ""}${c.s0.toFixed(2)} · ${terms}${more} → S=${c.S.toFixed(2)} (bounds ${SPRT_CFG.A_LOWER.toFixed(2)}/${SPRT_CFG.B_UPPER.toFixed(2)}, odds ${Math.exp(c.S).toFixed(1)}:1) → ${c.status}`;
}

export const sprtLambda = (S: number): number => sprtClamp(Math.exp(S), SPRT_CFG.LAMBDA_MIN, SPRT_CFG.LAMBDA_MAX);

// core decision: returns result object, or null = keep questioning / no match
export function sprtDecide(opts: SprtDecisionOptions): ClinicalEngineResult | null {
  const { collected, absent, riskMods, askedCount, gate, lang, force,
    patternKeys, PAT, namesTR, urgTR, urgEN, escalateFn, escNoteFn, redFlagFn, minQuestions, confMap} = opts;
  const gateBonus = gate ? (opts.gatePatterns?.[gate] || []) : [];
  const redFlag = redFlagFn(collected, lang);
  if (redFlag) {
    // Routing/label/urgency red-flag'ten gelir; ama ayırıcı tanı + λ'yı SPRT'ten türet.
    const rfSprt = runSPRT(patternKeys, collected, absent, riskMods, gateBonus, PAT, confMap);
    const rfDiffs = sprtDiffs(rfSprt, lang, PAT, namesTR, collected, absent, riskMods, gateBonus);
    // λ: red-flag pattern'inin gerçek SPRT skorundan; yoksa aktif liderden. Red-flag tabanı 9.6 korunur.
    const rfKey = redFlag.pattern;
    if (!rfKey) return redFlag;
    const rfS = rfSprt.per[rfKey]?.active ? rfSprt.per[rfKey].S
      : (rfSprt.confirmed[0] ? rfSprt.per[rfSprt.confirmed[0]].S
      : (rfSprt.indeterminate[0] ? rfSprt.per[rfSprt.indeterminate[0]].S : null));
    const rfLambda = rfS != null ? Math.max(9.6, sprtLambda(rfS)) : redFlag.lambda;
    // SPRT yörüngesini de taşı (QR'daki hesap satırı için) — lider hipotezin izini ekle.
    const rfLeadKey = rfSprt.per[rfKey]?.active ? rfKey : (rfSprt.confirmed[0] || rfSprt.indeterminate[0]);
    const rfLead = rfLeadKey ? rfSprt.per[rfLeadKey] : null;
    const rfSprtPayload = rfLead ? { topKey: rfLeadKey, S: rfLead.S, s0: rfLead.s0, traj: rfLead.traj, A: SPRT_CFG.A_LOWER, B: SPRT_CFG.B_UPPER, confirmed: rfSprt.confirmed, excluded: rfSprt.excluded } : null;
    return { ...redFlag, lambda: rfLambda, diffs: rfDiffs.length ? rfDiffs : redFlag.diffs, sprt: rfSprtPayload || redFlag.sprt, engine: "sprt-v2" };
  }
  if (!force && askedCount < minQuestions) return null;

  const sprt = runSPRT(patternKeys, collected, absent, riskMods, gateBonus, PAT, confMap);
  const urg = (r: Routing) => (lang === "tr" ? urgTR : urgEN)[r];
  const diffs = sprtDiffs(sprt, lang, PAT, namesTR, collected, absent, riskMods, gateBonus);

  // ── confirmed hypotheses: worst effective routing wins ──
  if (sprt.confirmed.length > 0) {
    let topKey: string | null = null, topRoute: Routing = "GREEN", escalatedAny = false;
    for (const k of sprt.confirmed) {
      const base = toRouting(PAT[k]?.routing_if_confirmed);
      const eff = escalateFn(base, k, collected);
      if (eff !== base) escalatedAny = true;
      if (!topKey || SPRT_ROUTE_RANK[eff] > SPRT_ROUTE_RANK[topRoute] ||
        (SPRT_ROUTE_RANK[eff] === SPRT_ROUTE_RANK[topRoute] && sprt.per[k].S > sprt.per[topKey].S)) {
        topKey = k; topRoute = eff;
      }
    }
    if (!topKey) return null;
    const c = sprt.per[topKey];
    const escNote = escalatedAny ? escNoteFn(topKey, collected, lang) : "";
    const alertParts = [escNote, sprtNarrative(topKey, c), PAT[topKey]?.doctor_alert || ""].filter(Boolean);
    return {
      routing: topRoute,
      lambda: escalatedAny ? Math.max(9.6, sprtLambda(c.S)) : sprtLambda(c.S),
      diffs, doctorAlert: alertParts.join("\n\n"), urgency: urg(topRoute),
      escalated: escalatedAny, engine: "sprt-v2",
      sprt: { topKey, S: c.S, s0: c.s0, traj: c.traj, A: SPRT_CFG.A_LOWER, B: SPRT_CFG.B_UPPER, confirmed: sprt.confirmed, excluded: sprt.excluded },
    };
  }

  // ── nothing confirmed ──
  if (!force) return null; // sequential: keep questioning

  // Eskalasyon TABANI: belirsizlik (soft evidence) deterministik güvenlik kurallarını
  // susturamaz. Açık (indeterminate) hipotezlerden herhangi biri kural-RED veriyorsa,
  // GREY çekimserliğine düşmeden önce RED'e yükselt — red-flag'lerle aynı doktrin.
  for (const ek of sprt.indeterminate) {
    if (escalateFn("YELLOW", ek, collected) === "RED") {
      const ec = sprt.per[ek];
      const note = escNoteFn(ek, collected, lang) || "";
      const parts = [note, sprtNarrative(ek, ec), PAT[ek]?.doctor_alert || ""].filter(Boolean);
      return {
        routing: "RED", lambda: Math.max(9.6, sprtLambda(ec.S)), diffs,
        doctorAlert: parts.join("\n\n"), urgency: urg("RED"),
        escalated: true, engine: "sprt-v2",
        sprt: { topKey: ek, S: ec.S, s0: ec.s0, traj: ec.traj, A: SPRT_CFG.A_LOWER, B: SPRT_CFG.B_UPPER, confirmed: sprt.confirmed, excluded: sprt.excluded },
      };
    }
  }

  // force-finalize: formal abstention if a critical hypothesis is still open
  const openCritical = sprt.indeterminate.filter((k: string) =>
    (PAT[k]?.risk === "critical") && sprt.per[k].S > SPRT_CFG.A_LOWER + SPRT_CFG.ABSTAIN_MARGIN);
  if (openCritical.length > 0) {
    const k = openCritical[0]; const c = sprt.per[k];
    return {
      routing: "GREY", lambda: sprtLambda(c.S), diffs,
      doctorAlert: `${sprtNarrative(k, c)}\n\n${PAT[k]?.doctor_alert || ""}`,
      urgency: urg("GREY"), escalated: false, engine: "sprt-v2",
      sprt: { topKey: k, S: c.S, s0: c.s0, traj: c.traj, A: SPRT_CFG.A_LOWER, B: SPRT_CFG.B_UPPER, confirmed: [], excluded: sprt.excluded, abstained: true },
    };
  }

  // provisional lean or GREEN fallback
  const open = sprt.indeterminate;
  if (open.length === 0) {
    if (diffs.length === 0) return null; // truly nothing matched — caller message
    const activeKey = Object.keys(sprt.per).find(k => sprt.per[k].active);
    return { routing: "GREEN", lambda: 0.05, diffs, doctorAlert: activeKey ? PAT[activeKey]?.doctor_alert || "" : "", urgency: urg("GREEN"), escalated: false, engine: "sprt-v2", sprt: null };
  }
  const k = open[0]; const c = sprt.per[k];
  let routing: Routing = "GREEN";
  if (c.S >= SPRT_CFG.LEAN_MIN) {
    const base = toRouting(PAT[k]?.routing_if_confirmed);
    routing = base === "RED" ? "GREY" : base;
  }
  const eff = escalateFn(routing, k, collected);
  const escNote = eff !== routing ? escNoteFn(k, collected, lang) : "";
  return {
    routing: eff, lambda: eff !== routing ? Math.max(9.6, sprtLambda(c.S)) : sprtLambda(c.S), diffs,
    doctorAlert: [escNote, sprtNarrative(k, c), PAT[k]?.doctor_alert || ""].filter(Boolean).join("\n\n"),
    urgency: urg(eff), escalated: eff !== routing, engine: "sprt-v2",
    sprt: { topKey: k, S: c.S, s0: c.s0, traj: c.traj, A: SPRT_CFG.A_LOWER, B: SPRT_CFG.B_UPPER, confirmed: [], excluded: sprt.excluded },
  };
}

// expected discrimination value of asking question q given current SPRT state:
// severity-weighted, plausibility-weighted movement toward either boundary,
// plus discovery value for hypotheses the question could newly activate.
export function sprtQuestionGain(q: { type?: string; triggers_yes?: string[]; scale_trigger?: string; scale_high_triggers?: string[]; weight?: number }, state: SprtState, present: string[], absent: string[], patternKeys: string[], PAT: PatternMap): number {
  const yesTrigs = (q.type === "yn" ? (q.triggers_yes || []) : [q.scale_trigger, ...(q.scale_high_triggers || [])]).filter((trigger): trigger is string => Boolean(trigger));
  const newTrigs = yesTrigs.filter((t) => !present.includes(t) && !absent.includes(t));
  if (newTrigs.length === 0) return 0;
  let gain = 0;
  for (const key of patternKeys) {
    const pat = PAT[key]; if (!pat) continue;
    const rel = newTrigs.filter((t) => (pat.triggers || []).includes(t));
    if (rel.length === 0) continue;
    const sev = (SPRT_SEV[pat.risk || "moderate"] ?? 1) + 0.5;
    const st = state.per[key];
    if (st && st.active && st.status === "indeterminate") {
      const plaus = Math.exp(Math.min(st.S, 2)); // capped posterior plausibility
      const dYes = rel.reduce((s: number, t: string) => s + Math.abs(sprtSymptomY(pat, t, true)), 0);
      const dNo = rel.reduce((s: number, t: string) => s + Math.abs(sprtSymptomY(pat, t, false)), 0);
      gain += sev * plaus * (dYes + dNo) / 2;
    } else if (!st || !st.active) {
      if ((pat.required_any || []).some((r: string) => newTrigs.includes(r))) {
        const dYes = rel.reduce((s: number, t: string) => s + Math.abs(sprtSymptomY(pat, t, true)), 0);
        gain += sev * 0.4 * dYes; // discovery weight for waking a hypothesis
      }
    }
  }
  return gain * (q.weight || 1);
}
// ═══════════════════════════ END SPRT ENGINE v2 ═══════════════════════════
