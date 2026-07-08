export function extractDeterministicTriggers(symptomText: string): string[] {
  const sx = (symptomText || "").toLowerCase();
  const triggers: string[] = [];
  if (/jaundice|yellow(ing)? (skin|eyes)|sarıl|gözler.{0,6}sarı|cild.{0,4}sarı|der.{0,4}sarı/.test(sx)) triggers.push("jaundice");
  if (/clay.?colou?red stool|pale stool|acholic|açık renkli dışkı|beyaz dışkı|kil renginde/.test(sx)) triggers.push("clay_stool");
  if (/fever|febrile|ateş|titreme|üşüme|rigor/.test(sx)) triggers.push("fever");
  if (/tachycardi|racing heart|rapid heart|heart racing|kalp.{0,8}hızl|çarpıntı/.test(sx)) triggers.push("tachycardia");
  if (/short(ness)? of breath|breathless|nefes darlığı|nefes alam/.test(sx)) triggers.push("shortness_of_breath");
  if (/vomit|throwing up|kusma|kusuyor|kustu/.test(sx)) triggers.push("vomiting");
  if (/fruity breath|aceton|keton|asetonlu nefes|meyve.{0,5}nefes|nefes.{0,6}meyve/.test(sx)) triggers.push("fruity_breath");
  if (/sudden onset|rapid onset|came on (fast|suddenly)|ani(den)? başla|hızla başla|aniden|birden/.test(sx)) triggers.push("rapid_onset");
  if (/abdominal pain|stomach pain|belly pain|karın ağrı|mide ağrı/.test(sx)) triggers.push("abdominal_pain");
  if (/low blood pressure|hypotension|düşük tansiyon|tansiyon.{0,4}düşük/.test(sx)) triggers.push("low_blood_pressure");
  if (/dizz|lighthead|baş dön|sersem/.test(sx)) triggers.push("dizziness");
  if (/rebound|releasing the press|bırakınca ağrı|elini? çekince ağrı/.test(sx)) triggers.push("rebound_tenderness");
  if (/chest pain|göğüs ağrı/.test(sx)) triggers.push("chest_pain");
  if (/cough(ing)? (up )?blood|hemoptys|kan tükür|kanlı balgam/.test(sx)) triggers.push("coughing_blood");
  if (/bayıl|bilinc?ini kaybet|kendinden geç|passed out|blacked out|lost consciousness/i.test(sx)) triggers.push("loss_of_consciousness");
  if (/boğaz(ım)? (daral|şiş)|dil(im)? şiş|nefes borusu|throat (closing|tight)|tongue swell/i.test(sx)) triggers.push("throat_tightness");
  if (/kanama durm|kanamayı durduram|won'?t stop bleeding|bleeding heavily|can'?t stop the bleed/i.test(sx)) triggers.push("bleeding_uncontrolled");
  if (/perde in|gölge indi|curtain (over|coming|across)/i.test(sx)) triggers.push("curtain_vision");
  if (/ani görme kayb|göremiyorum|görmüyor|lost (my )?vision|can'?t see/i.test(sx)) triggers.push("sudden_vision_loss");
  if (/kırmızı çizgi|red streak/i.test(sx)) triggers.push("red_streaks");
  return [...new Set(triggers)];
}
