export type StripPiece = {
  name?: string;
  lengthMm: number;
  widthMm: number;
  quantity: number;
  layers?: number;
};

export type TakeoffResult = {
  lamellaM: number;
  tapeLengthM: number;
  tapeM2FromStrips: number;
  pieces: Array<{
    name: string;
    kind: "lamella" | "tape";
    lengthMm: number;
    widthMm: number;
    quantity: number;
    layers: number;
    totalM: number;
    areaM2: number;
  }>;
};

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/**
 * Sum lamella running meters and tape area from a reinforcement sketch BOM.
 * Tape area = Σ(L × b × qty × layers). Layers default to 1: if the BOM already
 * lists each hoop once, do not double-count "в два слоя" unless the drawing
 * shows two separate wraps as extra quantity.
 */
export function takeoffFromPieces(input: {
  lamellas?: StripPiece[];
  tapes?: StripPiece[];
}): TakeoffResult {
  const pieces: TakeoffResult["pieces"] = [];

  for (const piece of input.lamellas ?? []) {
    const layers = piece.layers ?? 1;
    const totalM = round3((piece.lengthMm / 1000) * piece.quantity * layers);
    pieces.push({
      name: piece.name ?? `Ламель ${piece.lengthMm}×${piece.widthMm}`,
      kind: "lamella",
      lengthMm: piece.lengthMm,
      widthMm: piece.widthMm,
      quantity: piece.quantity,
      layers,
      totalM,
      areaM2: round3(totalM * (piece.widthMm / 1000)),
    });
  }

  for (const piece of input.tapes ?? []) {
    const layers = piece.layers ?? 1;
    const totalM = round3((piece.lengthMm / 1000) * piece.quantity * layers);
    pieces.push({
      name: piece.name ?? `Хомут ${piece.lengthMm}×${piece.widthMm}`,
      kind: "tape",
      lengthMm: piece.lengthMm,
      widthMm: piece.widthMm,
      quantity: piece.quantity,
      layers,
      totalM,
      areaM2: round3(totalM * (piece.widthMm / 1000)),
    });
  }

  const lamellaM = round3(
    pieces.filter((p) => p.kind === "lamella").reduce((sum, p) => sum + p.totalM, 0),
  );
  const tapePieces = pieces.filter((p) => p.kind === "tape");
  const tapeLengthM = round3(tapePieces.reduce((sum, p) => sum + p.totalM, 0));
  const tapeM2FromStrips = round3(tapePieces.reduce((sum, p) => sum + p.areaM2, 0));

  return { lamellaM, tapeLengthM, tapeM2FromStrips, pieces };
}
