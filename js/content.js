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

export async function fetchList() {
    const listResult = await fetch(`${dir}/_list.json`);

    try {
        const list = await listResult.json();

        return await Promise.all(
            list.map(async (path, rank) => {
                const levelResult = await fetch(`${dir}/${path}.json`);

                try {
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
    } catch {
        console.error(`Failed to load list.`);
        return null;
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

/* =========================
   CREATOR POINT RULES
   ========================= */
function getCreatorPoints(level) {
    const rating = (level.rating || '').toLowerCase();

    if (rating === 'epic') return 5;
    if (rating === 'featured') return 3;
    return 2; // standard
}

export async function fetchLeaderboard() {
    const list = await fetchList();
    const packs = await fetchPacks();

    const scoreMap = {};
    const errs = [];

    list.forEach(([level, err], rank) => {
        if (err) {
            errs.push(err);
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
                (u) => u.toLowerCase() === verifier.toLowerCase(),
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
        // VICTORS (beaten level)
        // =========================
        victors.forEach((name) => {
            if (name.toLowerCase() === verifier.toLowerCase()) return;

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
            .reduce((sum, s) => sum + s.score, 0);

        const creatorScore = scores.creatorScore || 0;

        // Build set of beaten levels
        const beaten = new Set([
            ...scores.verified.map(v => v.path),
            ...scores.victories.map(v => v.path),
        ]);

        // Packs
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

    return [res.sort((a, b) => b.total - a.total), errs];
}

export async function fetchPacks() {
    try {
        const res = await fetch(`${dir}/_packs.json`);
        return await res.json();
    } catch {
        return [];
    }
}
