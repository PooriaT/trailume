export type PolylinePoint = [number, number];

function isValidPoint(lat: number, lng: number) {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function readSignedChunk(encoded: string, cursor: { index: number }) {
  let result = 0;
  let shift = 0;

  while (true) {
    if (cursor.index >= encoded.length) {
      throw new Error("Truncated polyline chunk");
    }

    const byte = encoded.charCodeAt(cursor.index++) - 63;
    if (!Number.isFinite(byte) || byte < 0) {
      throw new Error("Invalid polyline byte");
    }

    result |= (byte & 0x1f) << shift;

    if (byte < 0x20) {
      return result & 1 ? ~(result >> 1) : result >> 1;
    }

    shift += 5;
    if (shift > 30) {
      throw new Error("Polyline chunk is too long");
    }
  }
}

export function decodePolyline(encoded: string | null | undefined): PolylinePoint[] {
  if (!encoded) {
    return [];
  }

  const points: PolylinePoint[] = [];
  const cursor = { index: 0 };
  let lat = 0;
  let lng = 0;

  try {
    while (cursor.index < encoded.length) {
      lat += readSignedChunk(encoded, cursor);
      lng += readSignedChunk(encoded, cursor);

      const nextLat = lat / 1e5;
      const nextLng = lng / 1e5;
      if (isValidPoint(nextLat, nextLng)) {
        points.push([nextLat, nextLng]);
      }
    }
  } catch {
    return [];
  }

  return points;
}
