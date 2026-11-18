/** Parent navigation maps to existing discovery filters, not invented backend categories. */
export const categoryPaths:Record<string,string>={products:'/?kind=products',food:'/?category=food',services:'/?kind=services',automotive:'/?category=carwash',education:'/coming-soon/education',health:'/coming-soon/health',home:'/?category=repairs',events:'/coming-soon/events',professional:'/coming-soon/professional'};
export function cartQuantity(items:unknown){return Array.isArray(items)?items.reduce((sum,item)=>{const value=Number(item?.quantity);return sum+(Number.isFinite(value)&&value>0?value:0);},0):0;}
export function mobileAccountPaths(role:'admin'|'owner'|'customer'|'guest'){
  return {orders:role==='admin'?'/portal/admin/orders':role==='owner'?'/portal/owner/orders':'/account/ledger',store:role==='admin'?'/portal/admin/stores':role==='owner'?'/portal/owner/stores':'/register/merchant',account:role==='admin'?'/portal/admin':role==='owner'?'/portal/owner':role==='customer'?'/account':'/login'};
}

type SearchableStore = { name: string; branch_name?: string };

function searchWords(text: string) {
  return text.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
}

// Adjacent swaps count as one edit alongside insertions, deletions and substitutions.
function typoDistance(term: string, word: string) {
  let twoBack: number[] = [];
  let previous = Array.from({ length: word.length + 1 }, (_, index) => index);
  for (let i = 1; i <= term.length; i++) {
    const row = [i];
    for (let j = 1; j <= word.length; j++) {
      const cost = term[i - 1] === word[j - 1] ? 0 : 1;
      row[j] = Math.min(previous[j] + 1, row[j - 1] + 1, previous[j - 1] + cost);
      if (i > 1 && j > 1 && term[i - 1] === word[j - 2] && term[i - 2] === word[j - 1]) {
        row[j] = Math.min(row[j], twoBack[j - 2] + 1);
      }
    }
    twoBack = previous;
    previous = row;
  }
  return previous[word.length];
}

function wordScore(term: string, word: string) {
  if (word === term) return 3;
  if (word.startsWith(term)) return 2;
  if (term.length >= 3 && word.includes(term)) return 2;
  const edits = term.length >= 8 ? 2 : term.length >= 4 ? 1 : 0;
  return edits && Math.abs(term.length - word.length) <= edits && typoDistance(term, word) <= edits ? 1 : 0;
}

export function searchMarketplaceStores<T extends SearchableStore>(stores: T[], query: string): T[] {
  const terms = searchWords(query);
  if (!terms.length) return [];
  const phrase = terms.join(' ');
  const matches = stores.flatMap(store => {
    const name = searchWords(store.name);
    const words = new Set([...name, ...searchWords(store.branch_name ?? '')]);
    const scores = terms.map(term => {
      let best = 0;
      for (const word of words) {
        best = Math.max(best, wordScore(term, word));
        if (best === 3) break;
      }
      return best;
    });
    return scores.every(score => score > 0)
      ? [{ store, score: scores.reduce((sum, score) => sum + score, 0), exactName: name.join(' ') === phrase }]
      : [];
  });
  return matches.sort((a, b) => Number(b.exactName) - Number(a.exactName) || b.score - a.score).map(match => match.store);
}
