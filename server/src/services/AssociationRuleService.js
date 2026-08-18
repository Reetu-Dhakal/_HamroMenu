export function apriori(transactions, minSupport = 0.02, minConfidence = 0.3, minLift = 1.0) {
  if (!transactions || transactions.length === 0) return { rules: [], itemsets: {} };

  const total = transactions.length;

  // Normalise: each transaction is an array of item ids (strings)
  const normalized = transactions.map(t => new Set(
    (t.items || []).map(it => it.menuItem?.toString()).filter(Boolean)
  ).filter(Boolean));

  // 1. Find frequent 1-itemsets
  const itemCounts = {};
  for (const tx of normalized) {
    for (const item of tx) {
      itemCounts[item] = (itemCounts[item] || 0) + 1;
    }
  }
  const frequent1 = Object.fromEntries(
    Object.entries(itemCounts).filter(([_, c]) => c / total >= minSupport)
  ).map(([k]) => k);

  if (frequent1.length === 0) return { rules: [], itemsets: { 1: {} } };

  // 2. Iteratively generate candidate k-itemsets and prune
  let frequentItemsets = { 1: frequent1 };
  let k = 2;

  while (frequentItemsets[k - 1] && Object.keys(frequentItemsets[k - 1]).length > 0) {
    const prev = frequentItemsets[k - 1];
    const candidates = new Set();

    // Join: combine (k-1)-itemsets that share first k-2 items
    const prevKeys = Object.keys(prev);
    for (let i = 0; i < prevKeys.length; i++) {
      for (let j = i + 1; j < prevKeys.length; j++) {
        const a = prevKeys[i].split(',').sort();
        const b = prevKeys[j].split(',').sort();
        let match = true;
        for (let d = 0; d < k - 2; d++) {
          if (a[d] !== b[d]) { match = false; break; }
        }
        if (match) {
          const combined = [...a, b[k - 2]].sort();
          candidates.add(combined.join(','));
        }
      }
    }

    // Prune: count support for each candidate
    const candidateCounts = {};
    for (const tx of normalized) {
      for (const cand of candidates) {
        const candSet = new Set(cand.split(','));
        if (candSet.size !== cand.split(',').length) continue;
        const hasAll = [...candSet].every(item => tx.has(item));
        if (hasAll) {
          candidateCounts[cand] = (candidateCounts[cand] || 0) + 1;
        }
      }
    }

    const currentFreq = {};
    for (const [cand, count] of Object.entries(candidateCounts)) {
      if (count / total >= minSupport) {
        currentFreq[cand] = count;
      }
    }

    if (Object.keys(currentFreq).length === 0) {
      // No more frequent itemsets; stop
      frequentItemsets[k] = {};
      break;
    }

    frequentItemsets[k] = currentFreq;
    k++;
  }

  // 3. Generate association rules from frequent itemsets
  const rules = [];

  // Re-collect counts for confidence/lift calculation
  const itemSupport = {};
  const pairSupport = {};

  for (const tx of normalized) {
    const items = [...tx];
    for (const item of items) {
      itemSupport[item] = (itemSupport[item] || 0) + 1;
    }
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const [a, b] = [items[i], items[j]].sort();
        const key = `${a},${b}`;
        pairSupport[key] = (pairSupport[key] || 0) + 1;
      }
    }
  }

  // For each frequent itemset of size >= 2, generate all non-empty subsets as rules
  const allFreq = { ...frequentItemsets[2] || {}, ...frequentItemsets[3] || {}, ...frequentItemsets[4] || {} };

  for (const [fsetKey, fsetCount] of Object.entries(allFreq)) {
    const items = fsetKey.split(',');
    const supportA = itemSupport[items[0]] || 0;

    // Generate all non-empty proper subsets as antecedents
    const n = items.length;
    for (let mask = 1; mask < (1 << n) - 1; mask++) {
      const antecedentItems = [];
      const consequentItems = [];
      for (let i = 0; i < n; i++) {
        if (mask & (1 << i)) antecedentItems.push(items[i]);
        else consequentItems.push(items[i]);
      }
      if (antecedentItems.length === 0 || consequentItems.length === 0) continue;

      const antecedentKey = antecedentItems.sort().join(',');
      const consequentKey = consequentItems.sort().join(',');
      const pairCount = pairSupport[`${antecedentItems[0]},${consequentItems[0]}`] || 0;

      const confidence = pairCount / (supportA || 1);
      if (confidence < minConfidence) continue;

      const lift = confidence / ((itemSupport[consequentItems[0]] || 1) / total);

      if (lift < minLift) continue;

      rules.push({
        antecedent: antecedentItems.join(' + '),
        consequent: consequentItems.join(' + '),
        support: fsetCount / total,
        confidence,
        lift,
        antecedent: antecedentItems,
        consequent: consequentItems,
      });
    }
  }

  // Sort by lift desc, then confidence desc
  rules.sort((a, b) => b.lift - a.lift || b.confidence - a.confidence);

  return { rules };
}