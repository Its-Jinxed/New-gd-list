 /**
 * Calculate the score awarded based on rank only (victor system)
 * @param {Number} rank Position on the list
 * @returns {Number}
 */
export function score(rank) {
    if (rank > 150) {
        return 0;
    }

    // Rank-based scoring formula (victor system)
    let score = (-24.9975 * Math.pow(rank - 1, 0.4) + 200);

    return Math.round(Math.max(score, 0));
}

/**
 * Round helper (now simplified since scale = 0)
 * Kept only for compatibility with existing code
 */
export function round(num) {
    return Math.round(num);
}
