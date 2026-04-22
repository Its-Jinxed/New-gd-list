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
                    console.log(level.verification, getYouTubeId(level.verification));
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
        const editors = await editorsResults.json();
        return editors;
    } catch {
        return null;
    }
}

export async function fetchLeaderboard() {
    const list = await fetchList();

    const scoreMap = {};
    const errs = [];

    list.forEach(([level, err], rank) => {
        if (err) {
            errs.push(err);
            return;
        }

        const levelScore = score(rank + 1, 100, level.percentToQualify);

        // Combine verifier + victors
        const victors = new Set([
            level.verifier,
            ...(level.victors ?? [])
        ]);

        victors.forEach((name) => {
            const user =
                Object.keys(scoreMap).find(
                    (u) => u.toLowerCase() === name.toLowerCase(),
                ) || name;

            scoreMap[user] ??= {
                victories: [],
            };

            scoreMap[user].victories.push({
                rank: rank + 1,
                level: level.name,
                path: level.path, // (useful later for packs)
                score: levelScore,
                link: level.verification,
            });
        });
    });

    const res = Object.entries(scoreMap).map(([user, scores]) => {
        const total = scores.victories.reduce((sum, s) => sum + s.score, 0);

        return {
            user,
            total: Math.round(total),
            victories: scores.victories,
        };
    });

    return [res.sort((a, b) => b.total - a.total), errs];
}
