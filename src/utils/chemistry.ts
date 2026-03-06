const ATOMIC_MASSES: Record<string, number> = {
  H: 1.008,
  He: 4.0026,
  Li: 6.94,
  Be: 9.0122,
  B: 10.81,
  C: 12.011,
  N: 14.007,
  O: 15.999,
  F: 18.998,
  Na: 22.989769,
  Mg: 24.305,
  Al: 26.981538,
  Si: 28.085,
  P: 30.973762,
  S: 32.06,
  Cl: 35.45,
  K: 39.0983,
  Ca: 40.078,
  Cr: 51.9961,
  Mn: 54.938044,
  Fe: 55.845,
  Co: 58.933194,
  Ni: 58.6934,
  Cu: 63.546,
  Zn: 65.38,
  Ag: 107.8682,
  I: 126.90447,
  Ba: 137.327,
  Pt: 195.084,
  Au: 196.96657,
  Hg: 200.592,
  Pb: 207.2,
};

const parseLeadingNumber = (value: string): { multiplier: number; rest: string } => {
  const match = value.match(/^([0-9]+(?:\.[0-9]+)?)(.*)$/);
  if (!match) return { multiplier: 1, rest: value };
  return {
    multiplier: Number(match[1]),
    rest: match[2],
  };
};

const parseSegmentMass = (formula: string): number => {
  let i = 0;

  const parseGroup = (): number => {
    let total = 0;

    while (i < formula.length) {
      const ch = formula[i];

      if (ch === '(') {
        i += 1;
        const groupMass = parseGroup();

        let multiplierText = '';
        while (i < formula.length && /[0-9.]/.test(formula[i])) {
          multiplierText += formula[i];
          i += 1;
        }
        const multiplier = multiplierText ? Number(multiplierText) : 1;
        total += groupMass * multiplier;
        continue;
      }

      if (ch === ')') {
        i += 1;
        return total;
      }

      if (/[A-Z]/.test(ch)) {
        let symbol = ch;
        i += 1;
        while (i < formula.length && /[a-z]/.test(formula[i])) {
          symbol += formula[i];
          i += 1;
        }

        let countText = '';
        while (i < formula.length && /[0-9.]/.test(formula[i])) {
          countText += formula[i];
          i += 1;
        }
        const count = countText ? Number(countText) : 1;

        const atomicMass = ATOMIC_MASSES[symbol];
        if (!atomicMass) {
          throw new Error(`Unknown element symbol: ${symbol}`);
        }

        total += atomicMass * count;
        continue;
      }

      // skip separators and phase markers
      if (ch === '+' || ch === '-' || ch === ' ' || ch === '[' || ch === ']') {
        i += 1;
        continue;
      }

      // ignore unsupported character instead of crashing whole request
      i += 1;
    }

    return total;
  };

  return parseGroup();
};

export const calculateMolarMass = (formula: string): number | null => {
  if (!formula || typeof formula !== 'string') return null;

  try {
    const normalized = formula
      .replace(/·/g, '.')
      .replace(/\(aq\)|\(s\)|\(l\)|\(g\)/gi, '')
      .trim();

    if (!normalized) return null;

    const parts = normalized.split('.').map((p) => p.trim()).filter(Boolean);
    let totalMass = 0;

    for (const part of parts) {
      const { multiplier, rest } = parseLeadingNumber(part);
      const segmentMass = parseSegmentMass(rest);
      totalMass += multiplier * segmentMass;
    }

    if (!Number.isFinite(totalMass) || totalMass <= 0) return null;

    return Number(totalMass.toFixed(6));
  } catch {
    return null;
  }
};
