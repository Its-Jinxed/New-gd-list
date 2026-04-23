import { fetchLeaderboard } from '../content.js';
import { localize } from '../util.js';
import Spinner from '../components/Spinner.js';

export default {
    components: { Spinner },

    data: () => ({
        leaderboard: [],
        loading: true,
        selected: 0,
        err: [],
        mode: 'total',
    }),

    template: `
        <main v-if="loading">
            <Spinner />
        </main>

        <main v-else class="page-leaderboard-container">
            <div class="page-leaderboard">

                <div class="error-container" v-if="err.length">
                    <p class="error">
                        Leaderboard may be incorrect: {{ err.join(', ') }}
                    </p>
                </div>

                <!-- TABS -->
                <div class="lb-tabs">
                    <button
                        class="lb-tab"
                        :class="{ active: mode === 'total' }"
                        @click="mode = 'total'"
                    >
                        Total Points
                    </button>

                    <button
                        class="lb-tab"
                        :class="{ active: mode === 'creator' }"
                        @click="mode = 'creator'"
                    >
                        Creator Points
                    </button>
                </div>

                <!-- LEFT TABLE -->
                <div class="board-container">
                    <table class="board">
                        <tr
                            v-for="(entry, i) in sortedLeaderboard"
                            :key="entry.user || i"
                        >
                            <td class="rank">
                                <p class="type-label-lg">#{{ i + 1 }}</p>
                            </td>

                            <td class="user" :class="{ active: selected === i }">
                                <button @click="selected = i">
                                    <span class="type-label-lg">
                                        {{ entry.user }} —
                                        {{ localize(entry.displayScore || 0) }} pts

                                        <span v-if="i === 0"> 🥇</span>
                                        <span v-else-if="i === 1"> 🥈</span>
                                        <span v-else-if="i === 2"> 🥉</span>
                                    </span>
                                </button>
                            </td>
                        </tr>
                    </table>
                </div>

                <!-- RIGHT PANEL -->
                <div class="player-container" v-if="entry">
                    <div class="player">

                        <!-- MATCH LEFT STYLE -->
                        <h1 class="type-label-lg">
                            #{{ selected + 1 }} {{ entry.user }} —
                            {{ localize(entry.displayScore || 0) }} pts
                        </h1>

                        <!-- PACK CHIPS -->
                        <div class="pack-badges" v-if="entry.packs?.length">
                            <span
                                v-for="pack in entry.packs"
                                :key="pack.name"
                                class="pack-badge"
                                :class="{ complete: pack.complete }"
                                :style="{
                                    background: pack.complete
                                        ? (pack.color || 'gold')
                                        : 'transparent'
                                }"
                            >
                                {{ pack.name }}
                            </span>
                        </div>

                        <!-- VERIFIED -->
                        <h2 v-if="entry.verified?.length" class="type-label-lg">
                            Verified ({{ entry.verified.length }})
                        </h2>

                        <table v-if="entry.verified?.length">
                            <tr v-for="score in entry.verified" :key="score.level">

                                <td class="rank">
                                    <p class="type-label-lg">#{{ score.rank }}</p>
                                </td>

                                <td class="level">
                                    <a
                                        :href="score.link"
                                        target="_blank"
                                        class="type-label-lg"
                                    >
                                        {{ score.level }}
                                    </a>
                                </td>

                                <td class="score">
                                    <p class="type-label-lg">
                                        +{{ localize(score.score) }}
                                    </p>
                                </td>
                            </tr>
                        </table>

                        <p v-else class="type-label-lg">
                            No verified levels.
                        </p>

                        <!-- VICTORIES -->
                        <h2 v-if="entry.victories?.length" class="type-label-lg">
                            Completed ({{ entry.victories.length }})
                        </h2>

                        <table v-if="entry.victories?.length">
                            <tr v-for="score in entry.victories" :key="score.level">

                                <td class="rank">
                                    <p class="type-label-lg">#{{ score.rank }}</p>
                                </td>

                                <td class="level">
                                    <a
                                        :href="score.link"
                                        target="_blank"
                                        class="type-label-lg"
                                    >
                                        {{ score.level }}
                                    </a>
                                </td>

                                <td class="score">
                                    <p class="type-label-lg">
                                        +{{ localize(score.score) }}
                                    </p>
                                </td>

                            </tr>
                        </table>

                        <p v-else class="type-label-lg">
                            No completed levels yet.
                        </p>

                    </div>
                </div>

            </div>
        </main>
    `,

    computed: {
        entry() {
            return this.sortedLeaderboard?.[this.selected] || {
                user: '',
                total: 0,
                victories: [],
                verified: [],
                packs: [],
                creatorScore: 0,
                displayScore: 0,
            };
        },

        sortedLeaderboard() {
            const list = Array.isArray(this.leaderboard)
                ? [...this.leaderboard]
                : [];

            return list
                .map(p => ({
                    ...p,
                    displayScore:
                        this.mode === 'creator'
                            ? (p.creatorScore || 0)
                            : (p.total || 0),
                }))
                .sort((a, b) => (b.displayScore || 0) - (a.displayScore || 0));
        },
    },

    async mounted() {
        try {
            const result = await fetchLeaderboard();

            if (Array.isArray(result)) {
                const [leaderboard, err] = result;

                this.leaderboard = Array.isArray(leaderboard)
                    ? leaderboard
                    : [];

                this.err = Array.isArray(err) ? err : [];
            } else {
                this.leaderboard = [];
                this.err = ['invalid_response'];
            }
        } catch (e) {
            console.error(e);
            this.leaderboard = [];
            this.err = ['fatal_error'];
        } finally {
            this.loading = false;
        }
    },

    methods: { localize },
};
