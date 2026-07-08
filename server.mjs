import 'dotenv/config.js';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import Anthropic from '@anthropic-ai/sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HOST = process.env.HOST || '127.0.0.1';
const PORT = parsePositiveInt(process.env.PORT, 4173, 1, 65535);
const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-6';
const ONLINE_TEST_ONLY = process.env.ONLINE_TEST_ONLY !== '0';
const TIMEOUT_MS = parsePositiveInt(process.env.CLAUDE_TIMEOUT_MS, 120_000, 1_000, 600_000);
const LOG_CONTENT = process.env.TEST_LOG_CONTENT === '1';
const API_KEY = process.env.ANTHROPIC_API_KEY;
const REPORT_LOG_FILE = path.join(__dirname, 'logs', 'case-reports.jsonl');
const IS_PRODUCTION = process.argv.includes('--production') || process.env.NODE_ENV === 'production';

const anthropic = API_KEY
  ? new Anthropic({ apiKey: API_KEY, timeout: TIMEOUT_MS, maxRetries: 1 })
  : null;
const app = express();

app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(express.json({ limit: '4mb', strict: true }));

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('X-Standard-Health-Mode', 'online-claude-api');
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    online: Boolean(API_KEY),
    apiConfigured: Boolean(API_KEY),
    fallbackUsed: false,
    model: MODEL,
    onlineTestOnly: ONLINE_TEST_ONLY
  });
});

app.get('/api/health/live', async (_req, res) => {
  if (!anthropic) {
    return res.status(503).json({
      ok: false,
      online: false,
      fallbackUsed: false,
      error: {
        code: 'API_NOT_CONFIGURED',
        message: 'Online mode is not configured yet.'
      }
    });
  }

  const requestId = crypto.randomUUID();
  const startedAt = Date.now();

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 8,
      temperature: 0,
      system: 'Reply with exactly OK.',
      messages: [{ role: 'user', content: 'Connectivity check.' }]
    });
    const text = extractTextContent(response);

    if (!text) {
      throw new OnlineBridgeError('EMPTY_MODEL_RESPONSE', 'Claude returned no text content.', 502);
    }

    res.setHeader('X-Request-Id', requestId);
    res.json({
      ok: true,
      online: true,
      fallbackUsed: false,
      engine: 'anthropic-messages-api',
      model: response.model || MODEL,
      requestId,
      durationMs: Date.now() - startedAt
    });
  } catch (error) {
    const normalized = normalizeError(error, requestId);
    res.status(normalized.httpStatus).json({
      ok: false,
      online: false,
      fallbackUsed: false,
      engine: 'anthropic-messages-api',
      error: {
        code: normalized.code,
        message: normalized.message,
        requestId
      }
    });
  }
});

app.post('/api/claude', async (req, res) => {
  if (!anthropic) {
    return res.status(503).json({
      ok: false,
      online: false,
      fallbackUsed: false,
      error: {
        code: 'API_NOT_CONFIGURED',
        message: 'Online mode is not configured yet.'
      }
    });
  }

  const requestId = crypto.randomUUID();
  const startedAt = Date.now();

  try {
    const payload = normalizeRequest(req.body);
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: payload.maxTokens,
      temperature: payload.temperature,
      system: payload.system,
      messages: payload.messages
    });

    const text = extractTextContent(response);

    if (!text) {
      throw new OnlineBridgeError('EMPTY_MODEL_RESPONSE', 'Claude returned no text content.', 502);
    }

    const result = {
      ok: true,
      online: true,
      fallbackUsed: false,
      engine: 'anthropic-messages-api',
      model: response.model || MODEL,
      text,
      stopReason: response.stop_reason ?? null,
      usage: response.usage ?? null,
      requestId,
      durationMs: Date.now() - startedAt
    };

    await writeLog({
      timestamp: new Date().toISOString(),
      requestId,
      status: 'success',
      model: result.model,
      durationMs: result.durationMs,
      usage: result.usage,
      ...(LOG_CONTENT ? { request: payload, responseText: text } : {})
    });

    res.setHeader('X-Request-Id', requestId);
    res.json(result);
  } catch (error) {
    const normalized = normalizeError(error, requestId);

    await writeLog({
      timestamp: new Date().toISOString(),
      requestId,
      status: 'error',
      code: normalized.code,
      message: normalized.message,
      durationMs: Date.now() - startedAt
    });

    res.status(normalized.httpStatus).json({
      ok: false,
      online: false,
      fallbackUsed: false,
      engine: 'anthropic-messages-api',
      error: {
        code: normalized.code,
        message: normalized.message,
        requestId
      }
    });
  }
});


app.get('/api/test-reports', async (_req, res, next) => {
  try {
    const reports = await readCaseReports();
    res.json({ ok: true, reports, aggregate: computeAggregate(reports) });
  } catch (error) {
    next(error);
  }
});

app.get('/api/test-reports/aggregate', async (_req, res, next) => {
  try {
    const reports = await readCaseReports();
    res.json({ ok: true, aggregate: computeAggregate(reports) });
  } catch (error) {
    next(error);
  }
});

app.get('/api/test-reports/export.csv', async (_req, res, next) => {
  try {
    const reports = await readCaseReports();
    const csv = reportsToCsv(reports);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="standard-health-case-reports.csv"');
    res.send(`\uFEFF${csv}`);
  } catch (error) {
    next(error);
  }
});

app.post('/api/test-reports', async (req, res, next) => {
  try {
    const report = normalizeCaseReport(req.body);
    await appendCaseReport(report);
    const reports = await readCaseReports();
    res.status(201).json({ ok: true, report, aggregate: computeAggregate(reports) });
  } catch (error) {
    next(error);
  }
});

app.use('/__test', express.static(path.join(__dirname, 'public'), {
  fallthrough: false,
  etag: false,
  maxAge: 0
}));

app.get('/', (req, res, next) => {
  if (ONLINE_TEST_ONLY && !Object.prototype.hasOwnProperty.call(req.query, 'test')) {
    return res.redirect(302, '/?test=1');
  }
  next();
});

if (IS_PRODUCTION) {
  const distDir = path.join(__dirname, 'dist');
  const indexFile = path.join(distDir, 'index.html');
  if (!fs.existsSync(indexFile)) {
    console.error('\nProduction build is missing. Run `npm run build` first.\n');
    process.exit(1);
  }
  app.use(express.static(distDir, { etag: false, maxAge: 0 }));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api/') || req.path.startsWith('/__test/')) return next();
    res.sendFile(indexFile);
  });
} else {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    root: __dirname,
    server: { middlewareMode: true },
    appType: 'spa'
  });
  app.use(vite.middlewares);
}

app.use((error, _req, res, _next) => {
  const requestId = crypto.randomUUID();
  const normalized = normalizeError(error, requestId);
  res.status(normalized.httpStatus).json({
    ok: false,
    online: false,
    fallbackUsed: false,
    error: {
      code: normalized.code,
      message: normalized.message,
      requestId
    }
  });
});

app.listen(PORT, HOST, () => {
  console.log(`\nStandard HealthCare: http://${HOST}:${PORT}/`);
  console.log(`Case report dashboard: http://${HOST}:${PORT}/__test/report.html`);
  console.log(`Model: ${MODEL}`);
  console.log(`API configured: ${API_KEY ? 'YES' : 'NO'}`);
  console.log(`Online-only fail-closed mode: ${ONLINE_TEST_ONLY ? 'ON' : 'OFF'}`);
  console.log(`Frontend mode: ${IS_PRODUCTION ? 'production build' : 'Vite development'}`);
});


function normalizeCaseReport(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new OnlineBridgeError('INVALID_REPORT', 'Report body must be a JSON object.', 400);
  }

  const caseId = cleanText(body.caseId, 'caseId', 120, true);
  const onlineConfirmed = body.onlineConfirmed === true;
  const patientStatements = normalizeStringList(body.patientStatements, 'patientStatements');
  const patientEnteredSymptoms = normalizeStringList(body.patientEnteredSymptoms, 'patientEnteredSymptoms');
  const expectedSymptoms = normalizeStringList(body.expectedSymptoms, 'expectedSymptoms');
  const extractedSymptoms = normalizeStringList(body.extractedSymptoms, 'extractedSymptoms');
  const metrics = computeSymptomMetrics({ patientEnteredSymptoms, expectedSymptoms, extractedSymptoms });
  const expectedTriage = cleanText(body.expectedTriage, 'expectedTriage', 120, true);
  const actualTriage = cleanText(body.actualTriage, 'actualTriage', 120, true);
  const expectedTriageCode = canonicalTriage(expectedTriage);
  const actualTriageCode = canonicalTriage(actualTriage);
  const triageCorrect = expectedTriageCode && actualTriageCode
    ? expectedTriageCode === actualTriageCode
    : normalizeLabel(expectedTriage) === normalizeLabel(actualTriage);
  const expectedRank = triageRank(expectedTriageCode);
  const actualRank = triageRank(actualTriageCode);
  const underTriage = expectedRank != null && actualRank != null && actualRank < expectedRank;
  const overTriage = expectedRank != null && actualRank != null && actualRank > expectedRank;
  const dangerousUnderTriage = body.dangerousUnderTriage === true;
  const targetDiagnosisRank = nullableInteger(body.targetDiagnosisRank, 1, 100);
  const hallucinatedFacts = normalizeStringList(body.hallucinatedFacts, 'hallucinatedFacts');
  const suggestedVerdict = suggestVerdict({
    onlineConfirmed,
    triageCorrect,
    dangerousUnderTriage,
    targetDiagnosisRank,
    metrics,
    hallucinatedFacts
  });
  const finalVerdict = normalizeVerdict(body.finalVerdict) || suggestedVerdict;

  return {
    reportId: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    caseId,
    caseNumber: nullableInteger(body.caseNumber, 1, 10_000),
    onlineConfirmed,
    onlineModel: cleanText(body.onlineModel, 'onlineModel', 120, false),
    onlineRequestCount: nullableInteger(body.onlineRequestCount, 0, 100_000),
    age: nullableInteger(body.age, 0, 130),
    sex: cleanText(body.sex, 'sex', 120, false),
    profileAnswers: cleanText(body.profileAnswers, 'profileAnswers', 10_000, false),
    targetCondition: cleanText(body.targetCondition, 'targetCondition', 500, true),
    hiddenCaseSummary: cleanText(body.hiddenCaseSummary, 'hiddenCaseSummary', 20_000, true),
    patientStatements,
    patientEnteredSymptoms,
    expectedSymptoms,
    extractedSymptoms,
    symptomMatchingNotes: cleanText(body.symptomMatchingNotes, 'symptomMatchingNotes', 10_000, false),
    symptomMetrics: metrics,
    expectedTriage,
    actualTriage,
    expectedTriageCode,
    actualTriageCode,
    triageCorrect,
    underTriage,
    overTriage,
    dangerousUnderTriage,
    targetDiagnosisRank,
    actualDifferential: normalizeStringList(body.actualDifferential, 'actualDifferential', 50),
    calculationOutput: cleanText(body.calculationOutput, 'calculationOutput', 20_000, false),
    hallucinatedFacts,
    missedCriticalQuestions: normalizeStringList(body.missedCriticalQuestions, 'missedCriticalQuestions'),
    repeatedQuestions: normalizeStringList(body.repeatedQuestions, 'repeatedQuestions'),
    contradictions: normalizeStringList(body.contradictions, 'contradictions'),
    uiStateProblems: normalizeStringList(body.uiStateProblems, 'uiStateProblems'),
    conversationTurns: nullableInteger(body.conversationTurns, 0, 1_000),
    transcript: cleanText(body.transcript, 'transcript', 100_000, false),
    evaluation: cleanText(body.evaluation, 'evaluation', 30_000, true),
    suggestedVerdict,
    finalVerdict
  };
}

function computeSymptomMetrics({ patientEnteredSymptoms, expectedSymptoms, extractedSymptoms }) {
  const enteredMap = normalizedMap(patientEnteredSymptoms);
  const expectedMap = normalizedMap(expectedSymptoms);
  const extractedMap = normalizedMap(extractedSymptoms);
  const expectedKeys = new Set(expectedMap.keys());
  const extractedKeys = new Set(extractedMap.keys());
  const enteredKeys = new Set(enteredMap.keys());

  const truePositiveKeys = [...expectedKeys].filter((key) => extractedKeys.has(key));
  const falsePositiveKeys = [...extractedKeys].filter((key) => !expectedKeys.has(key));
  const falseNegativeKeys = [...expectedKeys].filter((key) => !extractedKeys.has(key));
  const expectedNotEnteredKeys = [...expectedKeys].filter((key) => !enteredKeys.has(key));
  const enteredNotExpectedKeys = [...enteredKeys].filter((key) => !expectedKeys.has(key));

  const tp = truePositiveKeys.length;
  const fp = falsePositiveKeys.length;
  const fn = falseNegativeKeys.length;
  const precision = safeRatio(tp, tp + fp);
  const recall = safeRatio(tp, tp + fn);
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
  const jaccard = safeRatio(tp, tp + fp + fn);

  return {
    enteredCount: enteredKeys.size,
    expectedCount: expectedKeys.size,
    extractedCount: extractedKeys.size,
    truePositiveCount: tp,
    falsePositiveCount: fp,
    falseNegativeCount: fn,
    precision: roundMetric(precision),
    recall: roundMetric(recall),
    f1: roundMetric(f1),
    jaccardAccuracy: roundMetric(jaccard),
    truePositives: truePositiveKeys.map((key) => expectedMap.get(key)),
    falsePositives: falsePositiveKeys.map((key) => extractedMap.get(key)),
    falseNegatives: falseNegativeKeys.map((key) => expectedMap.get(key)),
    expectedButNotEntered: expectedNotEnteredKeys.map((key) => expectedMap.get(key)),
    enteredButNotExpected: enteredNotExpectedKeys.map((key) => enteredMap.get(key))
  };
}

function suggestVerdict({ onlineConfirmed, triageCorrect, dangerousUnderTriage, targetDiagnosisRank, metrics, hallucinatedFacts }) {
  if (!onlineConfirmed) return 'INVALID';
  if (dangerousUnderTriage) return 'FAIL';
  if (!triageCorrect || metrics.recall < 0.7) return 'FAIL';
  const diagnosisAcceptable = targetDiagnosisRank == null || targetDiagnosisRank <= 3;
  if (
    metrics.f1 >= 0.9 &&
    metrics.falsePositiveCount === 0 &&
    hallucinatedFacts.length === 0 &&
    diagnosisAcceptable
  ) return 'PASS';
  return 'PASS WITH WARNINGS';
}

function computeAggregate(reports) {
  const validReports = reports.filter((report) => report.onlineConfirmed && report.finalVerdict !== 'INVALID');
  const totals = validReports.reduce((acc, report) => {
    acc.tp += report.symptomMetrics?.truePositiveCount || 0;
    acc.fp += report.symptomMetrics?.falsePositiveCount || 0;
    acc.fn += report.symptomMetrics?.falseNegativeCount || 0;
    return acc;
  }, { tp: 0, fp: 0, fn: 0 });
  const precision = safeRatio(totals.tp, totals.tp + totals.fp);
  const recall = safeRatio(totals.tp, totals.tp + totals.fn);
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
  const verdicts = { PASS: 0, 'PASS WITH WARNINGS': 0, FAIL: 0, INVALID: 0 };
  for (const report of reports) verdicts[report.finalVerdict] = (verdicts[report.finalVerdict] || 0) + 1;

  return {
    totalCases: reports.length,
    validCases: validReports.length,
    invalidCases: reports.length - validReports.length,
    triageCorrectCount: validReports.filter((report) => report.triageCorrect).length,
    triageAccuracy: roundMetric(safeRatio(validReports.filter((report) => report.triageCorrect).length, validReports.length)),
    underTriageCount: validReports.filter((report) => report.underTriage).length,
    overTriageCount: validReports.filter((report) => report.overTriage).length,
    dangerousUnderTriageCount: validReports.filter((report) => report.dangerousUnderTriage).length,
    targetDiagnosisTop1Count: validReports.filter((report) => report.targetDiagnosisRank === 1).length,
    targetDiagnosisTop3Count: validReports.filter((report) => report.targetDiagnosisRank != null && report.targetDiagnosisRank <= 3).length,
    symptomMicroPrecision: roundMetric(precision),
    symptomMicroRecall: roundMetric(recall),
    symptomMicroF1: roundMetric(f1),
    symptomTotals: totals,
    verdicts
  };
}

async function appendCaseReport(report) {
  await fs.promises.mkdir(path.dirname(REPORT_LOG_FILE), { recursive: true });
  await fs.promises.appendFile(REPORT_LOG_FILE, `${JSON.stringify(report)}\n`, 'utf8');
}

async function readCaseReports() {
  try {
    const content = await fs.promises.readFile(REPORT_LOG_FILE, 'utf8');
    return content.split(/\r?\n/).filter(Boolean).map((line, index) => {
      try { return JSON.parse(line); }
      catch { throw new OnlineBridgeError('CORRUPT_REPORT_LOG', `Invalid JSON on report log line ${index + 1}.`, 500); }
    });
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

function reportsToCsv(reports) {
  const headers = [
    'caseId','createdAt','targetCondition','expectedTriage','actualTriage','triageCorrect','underTriage','overTriage',
    'targetDiagnosisRank','patientStatements','enteredSymptoms','expectedSymptoms','extractedSymptoms','tp','fp','fn',
    'precision','recall','f1','jaccardAccuracy','suggestedVerdict','finalVerdict','evaluation'
  ];
  const rows = reports.map((report) => [
    report.caseId, report.createdAt, report.targetCondition, report.expectedTriage, report.actualTriage,
    report.triageCorrect, report.underTriage, report.overTriage, report.targetDiagnosisRank ?? '',
    (report.patientStatements || []).join(' | '),
    (report.patientEnteredSymptoms || []).join(' | '), (report.expectedSymptoms || []).join(' | '),
    (report.extractedSymptoms || []).join(' | '), report.symptomMetrics?.truePositiveCount ?? 0,
    report.symptomMetrics?.falsePositiveCount ?? 0, report.symptomMetrics?.falseNegativeCount ?? 0,
    report.symptomMetrics?.precision ?? 0, report.symptomMetrics?.recall ?? 0,
    report.symptomMetrics?.f1 ?? 0, report.symptomMetrics?.jaccardAccuracy ?? 0,
    report.suggestedVerdict, report.finalVerdict, report.evaluation
  ]);
  return [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
}

function csvCell(value) {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function normalizedMap(values) {
  const map = new Map();
  for (const value of values) {
    const key = normalizeLabel(value);
    if (key && !map.has(key)) map.set(key, value.trim());
  }
  return map;
}

function canonicalTriage(value) {
  const label = normalizeLabel(value);
  if (!label) return null;
  if (hasAnyLabelToken(label, ['red', 'kirmizi']) || label.includes('emergency') || label.includes('acil')) return 'RED';
  if (hasAnyLabelToken(label, ['yellow', 'sari']) || label.includes('same day') || label.includes('today') || label.includes('bugun') || label.includes('urgent')) return 'YELLOW';
  if (hasAnyLabelToken(label, ['green', 'yesil']) || label.includes('monitor at home') || label.includes('evde izle') || label.includes('evde takip')) return 'GREEN';
  if (hasAnyLabelToken(label, ['grey', 'gray', 'gri']) || label.includes('unclear') || label.includes('belirsiz')) return 'GREY';
  return null;
}

function hasAnyLabelToken(label, tokens) {
  const parts = new Set(label.split(' ').filter(Boolean));
  return tokens.some((token) => parts.has(token));
}

function triageRank(code) {
  if (!code) return null;
  return ({ GREEN: 0, GREY: 1, YELLOW: 2, RED: 3 })[code] ?? null;
}

function normalizeLabel(value) {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase('tr-TR')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u00e7/g, 'c')
    .replace(/\u011f/g, 'g')
    .replace(/\u0131/g, 'i')
    .replace(/\u00f6/g, 'o')
    .replace(/\u015f/g, 's')
    .replace(/\u00fc/g, 'u')
    .replace(/[^a-z0-9çğıöşü]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeStringList(value, fieldName, maxItems = 200) {
  if (value == null || value === '') return [];
  const list = Array.isArray(value) ? value : String(value).split(/\r?\n/);
  if (list.length > maxItems) {
    throw new OnlineBridgeError('REPORT_LIST_TOO_LONG', `${fieldName} cannot exceed ${maxItems} items.`, 400);
  }
  return [...new Set(list.map((item) => cleanText(item, fieldName, 1_000, false)).filter(Boolean))];
}

function cleanText(value, fieldName, maxLength, required) {
  const text = value == null ? '' : String(value).trim();
  if (required && !text) throw new OnlineBridgeError('MISSING_REPORT_FIELD', `${fieldName} is required.`, 400);
  if (text.length > maxLength) throw new OnlineBridgeError('REPORT_FIELD_TOO_LONG', `${fieldName} exceeds ${maxLength} characters.`, 400);
  return text;
}

function nullableInteger(value, min, max) {
  if (value == null || value === '') return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new OnlineBridgeError('INVALID_REPORT_NUMBER', `Expected an integer between ${min} and ${max}.`, 400);
  }
  return parsed;
}

function normalizeVerdict(value) {
  if (value == null || value === '') return null;
  const verdict = String(value).trim().toUpperCase();
  const allowed = new Set(['PASS', 'PASS WITH WARNINGS', 'FAIL', 'INVALID']);
  if (!allowed.has(verdict)) throw new OnlineBridgeError('INVALID_VERDICT', 'Unsupported final verdict.', 400);
  return verdict;
}

function safeRatio(numerator, denominator) {
  return denominator === 0 ? 0 : numerator / denominator;
}

function roundMetric(value) {
  return Math.round(value * 10_000) / 10_000;
}

function normalizeRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new OnlineBridgeError('INVALID_REQUEST', 'Request body must be a JSON object.', 400);
  }

  const messages = normalizeMessages(body.messages);
  const system = normalizeSystem(body.system);
  const maxTokens = clampInteger(body.maxTokens ?? body.max_tokens ?? 4096, 64, 16_384);
  const temperature = clampNumber(body.temperature ?? 0.2, 0, 1);

  return { messages, system, maxTokens, temperature };
}

function normalizeMessages(value) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new OnlineBridgeError('INVALID_MESSAGES', 'messages must be a non-empty array.', 400);
  }

  if (value.length > 200) {
    throw new OnlineBridgeError('TOO_MANY_MESSAGES', 'messages cannot exceed 200 entries.', 400);
  }

  return value.map((message, index) => {
    if (!message || typeof message !== 'object') {
      throw new OnlineBridgeError('INVALID_MESSAGE', `messages[${index}] must be an object.`, 400);
    }

    if (message.role !== 'user' && message.role !== 'assistant') {
      throw new OnlineBridgeError('INVALID_ROLE', `messages[${index}].role must be user or assistant.`, 400);
    }

    const content = normalizeContent(message.content, `messages[${index}].content`);
    return { role: message.role, content };
  });
}

function normalizeSystem(value) {
  if (value == null || value === '') return undefined;
  return normalizeContent(value, 'system');
}

function normalizeContent(value, fieldName) {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      throw new OnlineBridgeError('EMPTY_CONTENT', `${fieldName} cannot be empty.`, 400);
    }
    return trimmed;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      throw new OnlineBridgeError('EMPTY_CONTENT', `${fieldName} cannot be empty.`, 400);
    }
    if (value.length > 100) {
      throw new OnlineBridgeError('TOO_MANY_CONTENT_BLOCKS', `${fieldName} cannot exceed 100 content blocks.`, 400);
    }
    return value.map((block, index) => normalizeTextContentBlock(block, `${fieldName}[${index}]`));
  }

  throw new OnlineBridgeError('INVALID_CONTENT', `${fieldName} must be a string or content-block array.`, 400);
}

function normalizeTextContentBlock(block, fieldName) {
  if (!block || typeof block !== 'object' || Array.isArray(block)) {
    throw new OnlineBridgeError('INVALID_CONTENT_BLOCK', `${fieldName} must be an object.`, 400);
  }
  if (block.type !== 'text') {
    throw new OnlineBridgeError('UNSUPPORTED_CONTENT_BLOCK', `${fieldName}.type must be text.`, 400);
  }
  const text = typeof block.text === 'string' ? block.text.trim() : '';
  if (!text) {
    throw new OnlineBridgeError('EMPTY_CONTENT', `${fieldName}.text cannot be empty.`, 400);
  }
  if (text.length > 100_000) {
    throw new OnlineBridgeError('CONTENT_TOO_LONG', `${fieldName}.text exceeds 100000 characters.`, 400);
  }
  return { type: 'text', text };
}

function extractTextContent(response) {
  return (response.content || [])
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();
}

function normalizeError(error, requestId) {
  if (error instanceof OnlineBridgeError) {
    return { code: error.code, message: error.message, httpStatus: error.httpStatus };
  }

  const status = Number(error?.status);
  const upstreamMessage = error?.error?.error?.message || error?.error?.message || error?.message;
  const safeMessage = typeof upstreamMessage === 'string'
    ? upstreamMessage.slice(0, 500)
    : 'Claude API request failed.';

  return {
    code: Number.isInteger(status) ? `ANTHROPIC_HTTP_${status}` : 'ANTHROPIC_REQUEST_FAILED',
    message: `${safeMessage} [request ${requestId}]`,
    httpStatus: Number.isInteger(status) && status >= 400 && status <= 599 ? status : 502
  };
}

class OnlineBridgeError extends Error {
  constructor(code, message, httpStatus = 500) {
    super(message);
    this.name = 'OnlineBridgeError';
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

function clampInteger(value, min, max) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return min;
  return Math.min(max, Math.max(min, parsed));
}

function clampNumber(value, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return min;
  return Math.min(max, Math.max(min, parsed));
}

function parsePositiveInt(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

async function writeLog(entry) {
  const logDir = path.join(__dirname, 'logs');
  const logFile = path.join(logDir, 'online-test.jsonl');
  await fs.promises.mkdir(logDir, { recursive: true });
  await fs.promises.appendFile(logFile, `${JSON.stringify(entry)}\n`, 'utf8');
}
