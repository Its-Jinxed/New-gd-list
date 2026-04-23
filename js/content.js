import { round, score } from './score.js';

const dir = 'data';

/* =========================
   YOUTUBE ID
========================= */
function getYouTubeId(url) {
    const match = url?.match(/(?:v=|youtu\.be\/|embed\/)([^&?/]+)/);
    return match ? match[1] : null;
}

/* =========================
   CREATOR POINTS SYSTEM
========================= */
export function creatorScore(rating) {
    switch ((rating || '').toLowerCase()) {
        case 'joke': return 1;
        case 'standard': return 2;
        case 'featured': return 3;
        case 'epic': return 5;
        default: return 0;
    }
}

/* =========================
   SAFE LIST FETCH
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

                    return [
                        {
                            ...level,
                            path,
                            youtubeId: getYouTubeId(level.verification),
                            creators: Array.isArray(level.creators)
                                ? level.creators
                                : [level.creators],
                            victors: level.victors ?? [],
                        },
                        null,
                    ];
                } catch (err) {
                    console.error(`Failed level ${rank + 1}: ${path}`, err);
                    return [null, path];
                }
            })
        );
    } catch (err) {
        console.error("Critical list load failure:", err);
        return [];
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

    if (!Array.isArray(list) || list.length === 0) {
        return [[], ["List failed to load"]];
    }

    list.forEach(([level, err], rank) => {
        if (err || !level) {
            errs.push(err || `level_${rank}`);
            return;
        }

        const levelScore = score(rank + 1);
        const creatorPoints = creatorScore(level.rating);

        const verifier = level.verifier;
        const victors = new Set(level.victors ?? []);

        /* =========================
           CREATOR
        ========================= */
        const creatorUser =
            Object.keys(scoreMap).find(
                u => u.toLowerCase() === verifier?.toLowerCase()
            ) || verifier;

        scoreMap[creatorUser] ??= {
            verified: [],
            victories: [],
            creatorScore: 0,
        };

        scoreMap[creatorUser].verified.push({
            rank: rank + 1,
            level: level.name,
            path: level.path,
            score: levelScore,
            link: level.verification,
        });

        scoreMap[creatorUser].creatorScore += creatorPoints;

        /* =========================
           VICTORS
        ========================= */
        victors.forEach(name => {
            if (!name || name.toLowerCase() === verifier?.toLowerCase()) return;

            const user =
                Object.keys(scoreMap).find(
                    u => u.toLowerCase() === name.toLowerCase()
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

    const result = Object.entries(scoreMap).map(([user, data]) => {
        const total = [...data.verified, ...data.victories]
            .reduce((sum, s) => sum + (s.score || 0), 0);

        const beaten = new Set([
            ...data.verified.map(v => v.path),
            ...data.victories.map(v => v.path),
        ]);

        const packsWithProgress = packs.map(pack => {
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
            creatorScore: data.creatorScore || 0,
            verified: data.verified,
            victories: data.victories,
            packs: packsWithProgress,
        };
    });

    return [
        result.sort((a, b) => b.total - a.total),
        errs
    ];
}
