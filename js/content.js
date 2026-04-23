import { round, score } from './score.js';

/**
 * Path to directory containing `_list.json` and all levels
 */
const dir = 'data';

/**
 * Youtube thumbnail function etc:
 */
function getYouTubeId(url) {
    const match = url?.match(/(?:v=|embed\/)([^&?/]+)/);
    return match ? match[1] : null;
}

/**
 * Calculate creator points based on level rating
 * @param {String} rating "Joke" | "Standard" | "Featured" | "Epic"
 * @returns {Number}
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

/* =========================
   SAFE LIST FETCH (FIXED)
   ========================= */
export async function fetchList() {
    try {
        const listResult = await fetch(`${dir}/_list.json`);

        if (!listResult.ok) {
            console.error("Failed to fetch _list.json");
            return [];
        }

        const list = await listResult.json();

        if (!Array.isArray(list)) {
            console.error("_list.json is not an array:", list);
            return [];
        }

        return await Promise.all(
            list.map(async (path, rank) => {
                try {
                    const levelResult = await fetch(`${dir}/${path}.json`);

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
                        },
                        null,
                    ];
                } catch (err) {
                    console.error(`Failed to load level #${rank + 1} ${path}.`, err);
                    return [null, path];
                }
            }),
        );
    } catch (err) {
        console.error("Critical list load failure:", err);
        return [];
    }
}

export async function fetchEditors() {
    try {
        const editorsResults = await fetch(`${dir}/_editors.json`);
        return await editorsResults.json();
    } catch {
        return null;
    }
}

export async function fetchPacks() {
    try {
        const res = await fetch(`${dir}/_packs.json`);
        if (!res.ok) return [];
        return await res.json();
    } catch {
        return [];
    }
}

/* =========================
   LEADERBOARD
   ========================= */
export async function fetchLeaderboard() {
    const list = await fetchList();
    const packs = await fetchPacks();

    const scoreMap = {};
    const errs = [];

    // 🛑 HARD GUARD (prevents infinite loading crash)
    if (!Array.isArray(list) || list.length === 0) {
        console.error("fetchList() returned invalid/empty data:", list);
        return [[], ["List failed to load"]];
    }

    list.forEach(([level, err], rank) => {
        if (err || !level) {
            errs.push(err || `level_${rank}`);
            return;
        }

        const levelScore = score(rank + 1);
        const creatorPoints = getCreatorPoints(level);

        const verifier = level.verifier;
        const victors = new Set(level.victors ?? []);

        // =========================
        // VERIFIED (creator)
        // =========================
        const verifiedUser =
            Object.keys(scoreMap).find(
                (u) => u.toLowerCase() === verifier?.toLowerCase(),
            ) || verifier;

        scoreMap[verifiedUser] ??= {
            verified: [],
            victories: [],
            creatorScore: 0,
        };

        scoreMap[verifiedUser].verified.push({
            rank: rank + 1,
            level: level.name,
            path: level.path,
            score: levelScore,
            creatorScore: creatorPoints,
            link: level.verification,
        });

        scoreMap[verifiedUser].creatorScore += creatorPoints;

        // =========================
        // VICTORS
        // =========================
        victors.forEach((name) => {
            if (!name || name.toLowerCase() === verifier?.toLowerCase()) return;

            const user =
                Object.keys(scoreMap).find(
                    (u) => u.toLowerCase() === name.toLowerCase(),
                ) || name;

            scoreMap[user] ??= {
                verified: [],
                victories: [],
                creatorScore: 0,
            };

            scoreMap[user].victories.push({
                rank: rank + 1,
                level: level.name,
                path: level.path,
                score: levelScore,
                link: level.verification,
            });
        });
    });

    const res = Object.entries(scoreMap).map(([user, scores]) => {
        const total = [...scores.verified, ...scores.victories]
            .reduce((sum, s) => sum + (s.score || 0), 0);

        const creatorScore = scores.creatorScore || 0;

        const beaten = new Set([
            ...scores.verified.map(v => v.path),
            ...scores.victories.map(v => v.path),
        ]);

        const userPacks = packs.map(pack => {
            const completed = pack.levels.filter(l => beaten.has(l)).length;

            return {
                ...pack,
                progress: completed,
                total: pack.levels.length,
                complete: completed === pack.levels.length,
            };
        });

        return {
            user,
            total: Math.round(total),
            creatorScore,
            verified: scores.verified,
            victories: scores.victories,
            packs: userPacks,
        };
    });

    return [
        res.sort((a, b) => b.total - a.total),
        errs
    ];
}
