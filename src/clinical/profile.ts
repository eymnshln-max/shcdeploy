import type { PatientProfile, ProfileAnswers } from "../types";

export function validateProfileAnswer(key: string, type: string, text: string, validationText: Record<string, string>) {
  const value = text.trim().toLowerCase();
  if (!value) return { ok: false, hint: validationText.empty };
  if (type === "choice") return { ok: true };

  if (type === "number") {
    const n = parseFloat(value);
    if (isNaN(n) || n <= 0) return { ok: false, hint: validationText.number };
    if (key === "age" && n < 18) return { ok: false, hint: validationText.age };
    if (key === "age" && n > 120) return { ok: false, hint: validationText.age_over };
    if (key === "height_cm" && (n < 50 || n > 250)) return { ok: false, hint: validationText.height };
    if (key === "weight_kg" && (n < 10 || n > 400)) return { ok: false, hint: validationText.weight };
  }

  return { ok: true };
}

export function parseProfile(answers: ProfileAnswers): PatientProfile {
  const profile: PatientProfile = {};

  for (const [key, value] of Object.entries(answers)) {
    const n = parseFloat(value);
    if (key === "age" && !isNaN(n)) profile.age = n;
    else if (key === "height_cm" && !isNaN(n)) profile.height = n;
    else if (key === "weight_kg" && !isNaN(n)) profile.weight = n;
    else if (key === "sex") profile.sex = /female|kadın|kadin/i.test(value) ? "female" : "male";
    else if (key === "smoking") profile.smoking = /yes|evet/i.test(value);
    else if (key === "diabetes") profile.diabetes = /yes|evet/i.test(value);
    else if (key === "hypertension") profile.hypertension = /yes|evet/i.test(value);
    else if (key === "family_history") profile.familyHistory = /yes|evet/i.test(value);
  }

  if (profile.height && profile.weight) profile.bmi = profile.weight / Math.pow(profile.height / 100, 2);
  return profile;
}
