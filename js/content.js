
import { score } from './score.js';

const dir = 'data';

let listCache = null;
let legacyCache = null;
let packsCache = null;
let editorsCache = null;
let leaderboardCache = null;

function getYouTubeId(url) {
    const match = url?.match(/(?:v=|embed\/)([^&?/]+)/);
    return match ? match[1] : null;
}

/**
 * Creator scoring system
 */
export function creatorScore(rating) {
    switch ((rating || '').toLowerCase()) {
        case 'joke':
            return 1;
        case 'standard':
            return 2;
        case 'featured':
            return 3;
        case 'epic':
            return 5;
        default:
            return 0;
    }
}

export function getCreatorPoints(level) {
    return creatorScore(level?.rating);
}

/* =========================
   PACK STATISTICS
========================= */

/**
 * Calculate average points and enjoyment for a pack.
 *
 * Every level has equal weighting for enjoyment.
 * Levels without enjoyment ratings default to 50.
 * Average points are rounded to the nearest 5.
 */
export function getPackStats(pack, levels = []) {

    const levelMap = new Map(
        levels.map(level => [level.path, level])
    );

    const packLevels = (pack?.levels ?? [])
        .map(path => levelMap.get(path))
        .filter(Boolean);

    // Calculate average points using each level's list score
    const pointValues = packLevels
        .map(level => score(level.trueRank))
        .filter(Number.isFinite);

    const rawAveragePoints = pointValues.length
        ? pointValues.reduce((sum, value) => sum + value, 0)
            / pointValues.length
        : 0;

    // Round to the nearest multiple of 5
    const averagePoints = Math.round(rawAveragePoints / 5) * 5;

    // Calculate each level's individual enjoyment average
    const levelEnjoyment = packLevels.map(level => {

        const ratings = (level.victors ?? [])
            .map(victor => victor?.enjoyment)
            .filter(value =>
                value !== null &&
                value !== undefined &&
                value !== '' &&
                Number.isFinite(Number(value))
            )
            .map(Number);

        if (ratings.length === 0) {
            return 50;
        }

        return ratings.reduce((sum, value) => sum + value, 0)
            / ratings.length;

    });

    // Average the level averages so every level has equal weighting
    const averageEnjoyment = levelEnjoyment.length
        ? levelEnjoyment.reduce((sum, value) => sum + value, 0)
            / levelEnjoyment.length
        : 50;

    return {
        averagePoints,
        averageEnjoyment: Math.round(averageEnjoyment * 100) / 100,
    };

}

/* =========================
   SAFE LIST FETCH
========================= */
export async function fetchList() {

    if (listCache) {
        return listCache;
    }

    try {

        const listResult = await fetch(`${dir}/_list.json`, {
            cache: "no-cache"
        });

        if (!listResult.ok) {
            console.error("Failed to fetch _list.json");
            return [];
        }

        const list = await listResult.json();

        if (!Array.isArray(list)) {
            console.error("_list.json is not an array:", list);
            return [];
        }

        listCache = await Promise.all(
            list.map(async (path, rank) => {
                try {

                    const levelResult = await fetch(`${dir}/${path}.json`, {
                        cache: "no-cache"
                    });

                    if (!levelResult.ok) {
                        throw new Error("Missing level file");
                    }

                    const level = await levelResult.json();

                    level.creators = Array.isArray(level.creators)
                        ? level.creators
                        : [level.creators];

                    return [
                        {
                            ...level,
                            path,
                            youtubeId: getYouTubeId(level.verification),
                            victors: level.victors ?? [],
                            trueRank: rank + 1,
                        },
                        null,
                    ];

                } catch (err) {

                    console.error(
                        `Failed to load level #${rank + 1} ${path}.`,
                        err
                    );

                    return [null, path];

                }
            })
        );

        return listCache;

    } catch (err) {

        console.error("Critical list load failure:", err);

        return [];

    }

}

/* =========================
   LEGACY LIST
========================= */
export async function fetchLegacyList() {

    if (legacyCache) {
        return legacyCache;
    }

    try {

        const legacyResult = await fetch(`${dir}/_legacy.json`, {
            cache: "no-cache"
        });

        if (!legacyResult.ok) {
            console.error("Failed to fetch _legacy.json");
            return [];
        }

        const legacyList = await legacyResult.json();

        if (!Array.isArray(legacyList)) {
            console.error("_legacy.json is not an array:", legacyList);
            return [];
        }

        legacyCache = await Promise.all(
            legacyList.map(async path => {

                try {

                    const levelResult =
                        await fetch(`${dir}/${path}.json`, {
                            cache: "no-cache"
                        });

                    if (!levelResult.ok) {
                        throw new Error("Missing level file");
                    }

                    const level = await levelResult.json();

                    level.creators = Array.isArray(level.creators)
                        ? level.creators
                        : [level.creators];

                    return {
                        ...level,
                        path,
                        youtubeId: getYouTubeId(level.verification),
                        victors: level.victors ?? [],
                    };

                } catch (err) {

                    console.error(
                        `Failed to load legacy level ${path}.`,
                        err
                    );

                    return null;

                }

            })
        );

        return legacyCache;

    } catch (err) {

        console.error("Critical legacy load failure:", err);

        return [];

    }

}

/* =========================
   EDITORS
========================= */
export async function fetchEditors() {

    if (editorsCache) {
        return editorsCache;
    }

    try {

        const res = await fetch(`${dir}/_editors.json`, {
            cache: "no-cache"
        });

        if (!res.ok) {
            return null;
        }

        editorsCache = await res.json();

        return editorsCache;

    } catch {

        return null;

    }

}

/* =========================
   PACKS
========================= */
export async function fetchPacks() {

    if (packsCache) {
        return packsCache;
    }

    try {

        const res = await fetch(`${dir}/_packs.json`, {
            cache: "no-cache"
        });

        if (!res.ok) {
            return [];
        }

        packsCache = await res.json();

        return packsCache;

    } catch {

        return [];

    }

}

/* =========================
   LEADERBOARD
========================= */
export async function fetchLeaderboard(list = null, packs = null) {

    if (leaderboardCache) {
        return leaderboardCache;
    }

    list ??= await fetchList();
    packs ??= await fetchPacks();

    const scoreMap = {};
    const errs = [];

    if (!Array.isArray(list) || list.length === 0) {
        return [[], ["List failed to load"]];
    }

    // Extract successfully loaded levels for pack statistics
    const validLevels = list
        .filter(([level, err]) => level && !err)
        .map(([level]) => level);

    list.forEach(([level, err], rank) => {

        if (err || !level) {
            errs.push(err || `level_${rank}`);
            return;
        }

        const levelScore = score(rank + 1);
        const creatorPoints = getCreatorPoints(level);

        const verifier = level.verifier;
        const victors = new Set(
            (level.victors ?? []).map(v => v.name)
        );
        const creators = new Set(level.creators ?? []);

        const verifiedUser =
            Object.keys(scoreMap).find(
                u => u.toLowerCase() === verifier?.toLowerCase()
            ) || verifier;

        scoreMap[verifiedUser] ??= {
            verified: [],
            victories: [],
            created: [],
            creatorScore: 0,
            packScore: 0,
        };

        scoreMap[verifiedUser].verified.push({
            rank: level.trueRank,
            level: level.name,
            path: level.path,
            score: levelScore,
            link: level.verification,
        });

        victors.forEach(name => {

            if (!name || name.toLowerCase() === verifier?.toLowerCase()) {
                return;
            }

            const user =
                Object.keys(scoreMap).find(
                    u => u.toLowerCase() === name.toLowerCase()
                ) || name;

            scoreMap[user] ??= {
                verified: [],
                victories: [],
                created: [],
                creatorScore: 0,
                packScore: 0,
            };

            scoreMap[user].victories.push({
                rank: level.trueRank,
                level: level.name,
                path: level.path,
                score: levelScore,
                link: level.verification,
            });

        });

        creators.forEach(creator => {

            const user =
                Object.keys(scoreMap).find(
                    u => u.toLowerCase() === creator?.toLowerCase()
                ) || creator;

            scoreMap[user] ??= {
                verified: [],
                victories: [],
                created: [],
                creatorScore: 0,
                packScore: 0,
            };

            scoreMap[user].created.push({
                rank: level.trueRank,
                level: level.name,
                path: level.path,
                score: creatorPoints,
                rating: level.rating,
            });

            scoreMap[user].creatorScore += creatorPoints;

        });

    });

    const res = Object.entries(scoreMap).map(([user, scores]) => {

        const beaten = new Set([
            ...scores.verified.map(v => v.path),
            ...scores.victories.map(v => v.path),
        ]);

        let packBonus = 0;

        const packsList = packs.map(pack => {

            const packStats = getPackStats(pack, validLevels);

            const completed = pack.levels.filter(
                level => beaten.has(level)
            ).length;

            const complete = completed === pack.levels.length;

            if (complete) {
                packBonus += packStats.averagePoints;
            }

            return {
                ...pack,
                ...packStats,
                progress: completed,
                total: pack.levels.length,
                complete,
            };

        });

        const baseTotal = [
            ...scores.verified,
            ...scores.victories,
        ].reduce(
            (sum, score) => sum + (score.score || 0),
            0
        );

        return {
            user,
            total: Math.round(baseTotal + packBonus),
            creatorScore: scores.creatorScore || 0,
            packScore: packBonus,
            verified: scores.verified,
            victories: scores.victories,
            created: scores.created || [],
            packs: packsList,
        };

    });

    leaderboardCache = [
        res.sort((a, b) => b.total - a.total),
        errs,
    ];

    return leaderboardCache;



    
// =========================================================
// POSITION HISTORY
// =========================================================

let positionHistoryCache = null;

const historicalLevelCache = new Map();

export async function fetchPositionHistory() {

    if (positionHistoryCache) {
        return positionHistoryCache;
    }

    const response = await fetch(
        "./data/_positionHistory.json",
        { cache: "no-cache" }
    );

    if (!response.ok) {
        throw new Error("Could not load position history.");
    }

    const history = await response.json();

    positionHistoryCache = history
        .filter(snapshot =>
            Number.isFinite(Date.parse(snapshot.date)) &&
            Array.isArray(snapshot.levels)
        )
        .sort((a, b) =>
            Date.parse(a.date) - Date.parse(b.date)
        );

    return positionHistoryCache;
}


// =========================================================
// GET SNAPSHOT BY DATE
// =========================================================

export function getHistoricalSnapshot(history, date) {

    const target = Date.parse(
        date + "T23:59:59.999Z"
    );

    return [...history].reverse().find(snapshot =>
        Date.parse(snapshot.date) <= target
    ) || null;
}


// =========================================================
// FETCH HISTORICAL LEVEL
// =========================================================

export async function fetchHistoricalLevel(path) {

    if (historicalLevelCache.has(path)) {
        return historicalLevelCache.get(path);
    }

    const promise = (async () => {

        try {

            const response = await fetch(
                "./data/" + encodeURIComponent(path) + ".json",
                { cache: "no-cache" }
            );

            if (!response.ok) {
                throw new Error("Level unavailable");
            }

            const level = await response.json();

            return {
                ...level,
                path,
                youtubeId: getYouTubeId(
                    level.showcase || level.verification || ""
                )
            };

        } catch {

            return {
                name: path,
                path,
                creators: [],
                victors: [],
                unavailable: true
            };

        }

    })();

    historicalLevelCache.set(path, promise);

    return promise;
}


// =========================================================
// INDIVIDUAL LEVEL HISTORY
// =========================================================

export function getLevelHistory(history, path) {

    const result = [];

    let previousRank;
    let previousStatus;

    for (const snapshot of history) {

        const index = snapshot.levels.indexOf(path);

        const rank = index === -1
            ? null
            : index + 1;

        const status = rank !== null
            ? "ranked"
            : (snapshot.legacy || []).includes(path)
                ? "legacy"
                : "unlisted";

        if (!result.length && status === "unlisted") {
            continue;
        }

        if (
            rank === previousRank &&
            status === previousStatus
        ) {
            continue;
        }

        result.push({
            date: snapshot.date,
            rank,
            status
        });

        previousRank = rank;
        previousStatus = status;

    }

    return result;
}

    
}
