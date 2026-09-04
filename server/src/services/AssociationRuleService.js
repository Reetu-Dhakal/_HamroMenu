/**
 * Apriori Algorithm for "Frequently Ordered Together" recommendations.
 * Mines association rules from order history using support, confidence, and lift.
 */

export function apriori(transactions, minSupport = 0.02, minConfidence = 0.3, minLift = 1.0) {
  if (!transactions || transactions.length === 0) return { rules: [], itemsets: {} };

  const total = transactions.length;

  // Normalize: each transaction is an array of item ids (strings)
  const normalized = transactions
    .map(t => (t.items || []).map(it => it.menuItem?.toString()).filter(Boolean))
    .filter(items => items.length >= 2);

  if (normalized.length === 0) return { rules: [], itemsets: {} };

  // 1. Count individual items
  const itemCounts = {};
  for (const tx of normalized) {
    for (const item of new Set(tx)) {
      itemCounts[item] = (itemCounts[item] || 0) + 1;
    }
  }

  // Frequent 1-itemsets
  const frequent1 = {};
  for (const [item, count] of Object.entries(itemCounts)) {
    if (count / total >= minSupport) {
      frequent1[item] = count;
    }
  }

  const frequentKeys = Object.keys(frequent1);
  if (frequentKeys.length < 2) return { rules: [], itemsets: { 1: frequent1 } };

  // 2. Find frequent pairs (2-itemsets)
  const pairCounts = {};
  for (const tx of normalized) {
    const unique = [...new Set(tx)];
    for (let i = 0; i < unique.length; i++) {
      for (let j = i + 1; j < unique.length; j++) {
        const [a, b] = [unique[i], unique[j]].sort();
        const key = `${a}|${b}`;
        pairCounts[key] = (pairCounts[key] || 0) + 1;
      }
    }
  }

  const frequentPairs = {};
  for (const [key, count] of Object.entries(pairCounts)) {
    if (count / total >= minSupport) {
      frequentPairs[key] = count;
    }
  }

  // 3. Generate association rules from frequent pairs
  const rules = [];

  for (const [key, pairCount] of Object.entries(frequentPairs)) {
    const [a, b] = key.split('|');
    const supportA = itemCounts[a] || 1;
    const supportB = itemCounts[b] || 1;

    // Rule: A -> B
    const confAB = pairCount / supportA;
    const liftAB = confAB / (supportB / total);
    if (confAB >= minConfidence && liftAB >= minLift) {
      rules.push({
        antecedent: a,
        consequent: b,
        support: pairCount / total,
        confidence: confAB,
        lift: liftAB,
      });
    }

    // Rule: B -> A
    const confBA = pairCount / supportB;
    const liftBA = confBA / (supportA / total);
    if (confBA >= minConfidence && liftBA >= minLift) {
      rules.push({
        antecedent: b,
        consequent: a,
        support: pairCount / total,
        confidence: confBA,
        lift: liftBA,
      });
    }
  }

  // Sort by lift desc, then confidence desc
  rules.sort((a, b) => b.lift - a.lift || b.confidence - a.confidence);

  return {
    rules,
    itemsets: { 1: frequent1, 2: frequentPairs },
  };
}
