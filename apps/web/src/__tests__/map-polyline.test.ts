import { decodePolyline } from "@/lib/map-polyline";

describe("decodePolyline", () => {
  it("decodes valid encoded polyline points", () => {
    expect(decodePolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@")).toEqual([
      [38.5, -120.2],
      [40.7, -120.95],
      [43.252, -126.453],
    ]);
  });

  it("returns no route for truncated chunks", () => {
    expect(decodePolyline("_")).toEqual([]);
    expect(decodePolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`")).toEqual([]);
  });

  it("returns no route for invalid chunks", () => {
    expect(decodePolyline(" ")).toEqual([]);
  });
});
