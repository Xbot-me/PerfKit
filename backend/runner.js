const puppeteer = require('puppeteer');
const { default: lighthouse } = require('lighthouse');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

function getRating(value, thresholds) {
  if (value === null || value === undefined) return 'unknown';
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.needs_improvement) return 'needs-improvement';
  return 'poor';
}

const CWV_THRESHOLDS = {
  lcp:         { good: 2500,  needs_improvement: 4000  },
  cls:         { good: 0.1,   needs_improvement: 0.25  },
  fid:         { good: 100,   needs_improvement: 300   },
  inp:         { good: 200,   needs_improvement: 500   },
  ttfb:        { good: 800,   needs_improvement: 1800  },
  fcp:         { good: 1800,  needs_improvement: 3000  },
  tbt:         { good: 200,   needs_improvement: 600   },
  speed_index: { good: 3400,  needs_improvement: 5800  },
};

function extractMetric(lhr, key) {
  const m = lhr.audits[key];
  if (!m) return { value: null, displayValue: null };
  return {
    value: m.numericValue ?? null,
    displayValue: m.displayValue ?? null,
  };
}

function extractAudits(lhr) {
  const audits = [];
  const categories = ['performance', 'accessibility', 'best-practices', 'seo'];

  for (const catKey of categories) {
    const cat = lhr.categories[catKey];
    if (!cat) continue;
    for (const ref of cat.auditRefs) {
      const audit = lhr.audits[ref.id];
      if (!audit || audit.scoreDisplayMode === 'informative' || audit.scoreDisplayMode === 'notApplicable') continue;
      if (audit.score === 1 || audit.score === null) continue; // only include failing/warning
      audits.push({
        id: audit.id,
        title: audit.title,
        description: audit.description,
        score: audit.score,
        displayValue: audit.displayValue,
        scoreDisplayMode: audit.scoreDisplayMode,
        category: catKey,
        weight: ref.weight || 0,
        details: audit.details ? summarizeDetails(audit.details) : null,
      });
    }
  }

  return audits.sort((a, b) => {
    const impactA = (1 - (a.score || 0)) * (a.weight || 0);
    const impactB = (1 - (b.score || 0)) * (b.weight || 0);
    return impactB - impactA;
  });
}

function summarizeDetails(details) {
  if (!details) return null;
  if (details.type === 'opportunity') {
    return {
      type: 'opportunity',
      overallSavingsMs: details.overallSavingsMs,
      headings: (details.headings || []).map(h => h.label || h.key),
      items: (details.items || []).slice(0, 5).map(item => ({
        url: item.url,
        wastedMs: item.wastedMs,
        wastedBytes: item.wastedBytes,
        totalBytes: item.totalBytes,
      })),
    };
  }
  if (details.type === 'table') {
    return {
      type: 'table',
      headings: (details.headings || []).map(h => h.label || h.key),
      items: (details.items || []).slice(0, 5),
    };
  }
  return { type: details.type };
}

function buildWaterfall(har) {
  if (!har || !har.log || !har.log.entries) return [];
  return har.log.entries.map((entry, idx) => {
    const req = entry.request;
    const res = entry.response;
    const timings = entry.timings || {};
    const startMs = entry._requestTime ? entry._requestTime * 1000 : 0;

    const dns     = Math.max(0, timings.dns     || 0);
    const connect = Math.max(0, timings.connect || 0);
    const ssl     = Math.max(0, timings.ssl     || 0);
    const send    = Math.max(0, timings.send    || 0);
    const wait    = Math.max(0, timings.wait    || 0);
    const receive = Math.max(0, timings.receive || 0);
    const total   = dns + connect + ssl + send + wait + receive;

    let type = 'other';
    const ct = (res.content?.mimeType || '').toLowerCase();
    if (ct.includes('html'))       type = 'document';
    else if (ct.includes('css'))   type = 'stylesheet';
    else if (ct.includes('javascript') || ct.includes('script')) type = 'script';
    else if (ct.includes('image') || /\.(png|jpg|jpeg|gif|webp|svg|ico)/.test(req.url)) type = 'image';
    else if (ct.includes('font') || /\.(woff|woff2|ttf|otf|eot)/.test(req.url)) type = 'font';
    else if (ct.includes('json') || ct.includes('xml')) type = 'xhr';

    return {
      idx,
      url: req.url,
      method: req.method,
      status: res.status,
      type,
      startMs,
      dns, connect, ssl, send, wait, receive,
      totalMs: total,
      transferSize: res._transferSize || res.content?.size || 0,
      resourceSize: res.content?.size || 0,
    };
  }).sort((a, b) => a.startMs - b.startMs);
}

async function runAnalysis(url) {
  let browser = null;
  const result = {};

  try {
    // Launch puppeteer with CDP for HAR
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--remote-debugging-port=9222',
      ],
      executablePath: puppeteer.executablePath(),
    });

    const wsEndpoint = browser.wsEndpoint();
    const port = new URL(wsEndpoint).port;

    // --- Run Lighthouse ---
    const lhrResult = await lighthouse(url, {
      port: parseInt(port),
      output: 'json',
      logLevel: 'error',
      formFactor: 'desktop',
      screenEmulation: {
        mobile: false,
        width: 1350,
        height: 940,
        deviceScaleFactor: 1,
        disabled: false,
      },
      throttlingMethod: 'simulate',
      throttling: {
        rttMs: 40,
        throughputKbps: 10240,
        cpuSlowdownMultiplier: 1,
      },
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    });

    const lhr = lhrResult.lhr;

    // Scores
    result.score_performance   = Math.round((lhr.categories.performance?.score   || 0) * 100);
    result.score_accessibility = Math.round((lhr.categories.accessibility?.score || 0) * 100);
    result.score_best_practices= Math.round((lhr.categories['best-practices']?.score || 0) * 100);
    result.score_seo           = Math.round((lhr.categories.seo?.score           || 0) * 100);

    // Core Web Vitals
    const lcp  = extractMetric(lhr, 'largest-contentful-paint');
    const cls  = extractMetric(lhr, 'cumulative-layout-shift');
    const tbt  = extractMetric(lhr, 'total-blocking-time');
    const fcp  = extractMetric(lhr, 'first-contentful-paint');
    const ttfb = extractMetric(lhr, 'server-response-time');
    const si   = extractMetric(lhr, 'speed-index');

    result.lcp_value  = lcp.value;  result.lcp_rating  = getRating(lcp.value,  CWV_THRESHOLDS.lcp);
    result.cls_value  = cls.value;  result.cls_rating  = getRating(cls.value,  CWV_THRESHOLDS.cls);
    result.tbt_value  = tbt.value;  result.tbt_rating  = getRating(tbt.value,  CWV_THRESHOLDS.tbt);
    result.fcp_value  = fcp.value;  result.fcp_rating  = getRating(fcp.value,  CWV_THRESHOLDS.fcp);
    result.ttfb_value = ttfb.value; result.ttfb_rating = getRating(ttfb.value, CWV_THRESHOLDS.ttfb);
    result.speed_index_value  = si.value;   result.speed_index_rating  = getRating(si.value,   CWV_THRESHOLDS.speed_index);
    result.inp_value  = null;       result.inp_rating  = 'unknown'; // lab data only
    result.fid_value  = null;       result.fid_rating  = 'unknown';

    // Page stats
    const domSize = lhr.audits['dom-size'];
    result.dom_size = domSize?.numericValue || null;
    result.fully_loaded_ms = Math.round(lhr.timing?.total || 0);

    // Network requests from Lighthouse
    const netReqs = lhr.audits['network-requests'];
    if (netReqs?.details?.items) {
      const items = netReqs.details.items;
      result.total_requests = items.length;
      result.total_bytes = items.reduce((sum, r) => sum + (r.transferSize || 0), 0);
    }

    // Audits
    result.audits_json = JSON.stringify(extractAudits(lhr));

    // Filmstrip from Lighthouse screenshots
    const filmstripAudit = lhr.audits['screenshot-thumbnails'];
    if (filmstripAudit?.details?.items) {
      result.filmstrip_json = JSON.stringify(
        filmstripAudit.details.items.map(f => ({
          timing: f.timing,
          data: f.data,
        }))
      );
    }

    // Full screenshot from Lighthouse final screenshot
    const screenshotAudit = lhr.audits['final-screenshot'];
    if (screenshotAudit?.details?.data) {
      const screenshotData = screenshotAudit.details.data.replace(/^data:image\/\w+;base64,/, '');
      const screenshotFile = `${Date.now()}.jpg`;
      const screenshotPath = path.join(SCREENSHOTS_DIR, screenshotFile);
      fs.writeFileSync(screenshotPath, Buffer.from(screenshotData, 'base64'));
      result.screenshot_path = screenshotFile;
    }

    // HAR via network-requests audit (simplified waterfall)
    if (netReqs?.details?.items) {
      const entries = netReqs.details.items.map((r, idx) => ({
        idx,
        url: r.url,
        method: r.resourceType || 'GET',
        status: r.statusCode || 200,
        type: (r.resourceType || 'other').toLowerCase(),
        startMs: r.startTime || 0,
        totalMs: (r.endTime || 0) - (r.startTime || 0),
        transferSize: r.transferSize || 0,
        resourceSize: r.resourceSize || 0,
        dns: 0, connect: 0, ssl: 0, send: 0,
        wait: Math.max(0, ((r.endTime || 0) - (r.startTime || 0)) * 0.7),
        receive: Math.max(0, ((r.endTime || 0) - (r.startTime || 0)) * 0.3),
      }));
      result.har_json = JSON.stringify(entries);
    }

    return result;
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = { runAnalysis };
