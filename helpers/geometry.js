const wellknown = require('wellknown');

function safeParseGeo(jsonString) {
  if (!jsonString) return null;

  try {
    // Already valid JSON
    if (typeof jsonString !== "string") return jsonString;

    // Clean CSV escape issues
    const clean = jsonString
      .replace(/'/g, '"')             // convert single → double quotes
      .replace(/\s+/g, ' ')           // normalize whitespace
      .replace(/,\s*]/g, ']')         // fix trailing commas
      .replace(/,\s*}/g, '}');

    return JSON.parse(clean);
  } catch (e) {
    console.log("❌ Failed to parse GeoJSON:", jsonString);
    return null;
  }
}

/**
 * Recursively convert all coordinates to numbers
 */
function deepValidateCoords(coords) {
  if (!Array.isArray(coords)) return coords;

  if (typeof coords[0] === 'number') {
    return coords.map(Number); // [lng, lat]
  } else {
    return coords.map(deepValidateCoords);
  }
}


/**
 * Safely parse GeoJSON or WKT.
 * Works across all machines consistently.
 */
function parseGeometry(raw) {
  if (!raw) return null;

  // Already object
  if (typeof raw === 'object') return raw;

  raw = raw.trim();
  if (!raw || raw === 'None' || raw === 'null') return null;

  // Try JSON GeoJSON
  if (raw.startsWith('{')) {
    try {
      return JSON.parse(raw);
    } catch (err) {
      console.error("JSON parse failed:", raw);
    }
  }

  // Try WKT
  try {
    const wk = wellknown(raw);
    if (wk && wk.type && wk.coordinates) return wk;
  } catch (err) {
    console.error("WKT parse failed:", raw);
  }

  console.error("Invalid geometry:", raw);
  return null;
}

module.exports = { parseGeometry, safeParseGeo, deepValidateCoords };
