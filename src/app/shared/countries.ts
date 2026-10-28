const names = new Intl.DisplayNames(['en'], { type: 'region' });

// Codes that are regions or special codes, not countries
const skip = ['AC', 'CP', 'DG', 'EA', 'EU', 'EZ', 'IC', 'QO', 'TA', 'UN', 'XA', 'XB', 'ZZ'];

const list: string[] = [];

for (let a = 65; a <= 90; a++) {
  for (let b = 65; b <= 90; b++) {
    const code = String.fromCharCode(a, b);
    if (skip.includes(code)) continue;
    try {
      const name = names.of(code);
      if (name && name !== code) list.push(name);
    } catch {}
  }
}

export const COUNTRIES: string[] = [...new Set(list)].sort((x, y) => x.localeCompare(y));
