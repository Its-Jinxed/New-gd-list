/**
 * @param {Number} rank Position on the list
 * @returns {Number}
 */
export function score(rank) {
    // Only top 30 levels on curve, after that everything is worth 5
    if (rank > 30) {
        return 5;
    }

    const max = 250;
    const min = 10;

    // Normalize rank (0 → 1)
    const t = (rank - 1) / 29;

    // Cubic curve (p = 3)
    const points = min + (max - min) * Math.pow(1 - t, 3);

    return Math.round(points);
}

/**
 * Round helper (kept for compatibility)
 */
export function round(num) {
    return Math.round(num);
}
