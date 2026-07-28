// AniSkip Service (api.aniskip.com) for OP/ED Skip Intervals
const ANISKIP_BASE = 'https://api.aniskip.com/v2/skip-times';

// In-memory cache for skip intervals keyed by `${malId}_${episode}`
const aniSkipCache = new Map();

export async function fetchAniSkipIntervals(malId, episode = 1) {
  if (!malId) return { found: false, op: null, ed: null };

  const cacheKey = `${malId}_${episode}`;
  if (aniSkipCache.has(cacheKey)) {
    return aniSkipCache.get(cacheKey);
  }

  try {
    const url = `${ANISKIP_BASE}/${malId}/${episode}?types=op&types=ed`;
    const res = await fetch(url);
    if (!res.ok) {
      const heuristicResult = {
        found: true,
        isHeuristic: true,
        op: { interval: { startTime: 90, endTime: 175 } }, // Heuristic +85s OP skip
        ed: null
      };
      aniSkipCache.set(cacheKey, heuristicResult);
      return heuristicResult;
    }

    const data = await res.json();
    if (data.found && data.results) {
      const opData = data.results.find(r => r.skipType === 'op') || null;
      const edData = data.results.find(r => r.skipType === 'ed') || null;
      const parsedResult = {
        found: true,
        isHeuristic: false,
        op: opData ? { interval: { startTime: opData.interval.startTime, endTime: opData.interval.endTime } } : null,
        ed: edData ? { interval: { startTime: edData.interval.startTime, endTime: edData.interval.endTime } } : null
      };
      aniSkipCache.set(cacheKey, parsedResult);
      return parsedResult;
    }
  } catch (err) {
    console.warn('AniSkip API error, using heuristic fallback (+85s):', err.message);
  }

  // Fallback Heuristic +85s if API call fails or found=false
  const heuristicResult = {
    found: true,
    isHeuristic: true,
    op: { interval: { startTime: 90, endTime: 175 } },
    ed: null
  };
  aniSkipCache.set(cacheKey, heuristicResult);
  return heuristicResult;
}
