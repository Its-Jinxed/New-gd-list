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
                    List Points
                </button>

                <button
                    class="lb-tab"
                    :class="{ active: mode === 'creator' }"
                    @click="mode = 'creator'"
                >
                    Creator Points
                </button>
            </div>

            <!-- LEFT -->
            <div class="board-container">
                <table class="board">
                    <tr
                        v-for="(entry, i) in leaderboard"
                        :key="entry.user || i"
                    >

                        <td class="rank">
                            <p class="type-label-lg">#{{ i + 1 }}</p>
                        </td>

                        <td class="user" :class="{ active: selected === i }">
                            <button @click="selected = i">
                                <span class="type-label-lg">
                                    {{ entry.user }} —
                                    {{ mode === 'creator'
                                        ? localize(entry.creatorScore || 0)
                                        : localize(entry.total || 0)
                                    }} pts

                                    <span v-if="i === 0"> 🥇</span>
                                    <span v-else-if="i === 1"> 🥈</span>
                                    <span v-else-if="i === 2"> 🥉</span>
                                </span>
                            </button>
                        </td>

                    </tr>
                </table>
            </div>

            <!-- RIGHT -->
            <div class="player-container" v-if="entry">
                <div class="player">

                    <h1 class="lb-title">
                        #{{ selected + 1 }} {{ entry.user }} —
                        {{ mode === 'creator'
                            ? localize(entry.creatorScore || 0)
                            : localize(entry.total || 0)
                        }} pts
                    </h1>

                    <!-- =========================
                         LIST POINTS VIEW
                    ========================== -->
                    <template v-if="mode === 'total'">

                        <h2 v-if="entry.verified?.length">
                            Verified ({{ entry.verified.length }})
                        </h2>

                        <table v-if="entry.verified?.length">
                            <tr v-for="score in entry.verified" :key="score.level">
                                <td class="rank">
                                    <p class="type-label-lg">#{{ score.rank }}</p>
                                </td>

                                <td class="level">
                                    <a :href="score.link" target="_blank">
                                        <span class="type-label-lg">
                                            {{ score.level }}
                                        </span>
                                    </a>
                                </td>

                                <td class="score">
                                    <p class="type-label-lg">
                                        +{{ localize(score.score) }}
                                    </p>
                                </td>
                            </tr>
                        </table>

                        <p v-else class="type-label-lg">No verified levels.</p>

                        <h2 v-if="entry.victories?.length">
                            Completed ({{ entry.victories.length }})
                        </h2>

                        <table v-if="entry.victories?.length">
                            <tr v-for="score in entry.victories" :key="score.level">
                                <td class="rank">
                                    <p class="type-label-lg">#{{ score.rank }}</p>
                                </td>

                                <td class="level">
                                    <a :href="score.link" target="_blank">
                                        <span class="type-label-lg">
                                            {{ score.level }}
                                        </span>
                                    </a>
                                </td>

                                <td class="score">
                                    <p class="type-label-lg">
                                        +{{ localize(score.score) }}
                                    </p>
                                </td>
                            </tr>
                        </table>

                        <p v-else class="type-label-lg">No completed levels yet.</p>

                    </template>

                    <!-- =========================
                         CREATOR VIEW (GROUPED)
                    ========================== -->
                    <template v-else>

                        <h2 v-if="entry.created?.length">
                            Created Levels ({{ entry.created.length }})
                        </h2>

                        <div v-if="entry.created?.length">

                            <!-- LOOP GROUPS -->
                            <div v-for="(levels, rating) in groupedCreated" :key="rating">

                                <h3 class="type-title-sm">{{ rating }}</h3>

                                <table>
                                    <tr v-for="score in levels" :key="score.level">

                                        <td class="rank">
                                            <p class="type-label-lg">#{{ score.rank }}</p>
                                        </td>

                                        <td class="level">
                                            <span class="type-label-lg">
                                                {{ score.level }}
                                            </span>
                                        </td>

                                        <td class="score">
                                            <p class="type-label-lg">
                                                +{{ localize(score.score) }}
                                            </p>
                                        </td>

                                    </tr>
                                </table>

                            </div>

                        </div>

                        <p v-else class="type-label-lg">
                            No created levels yet.
                        </p>

                    </template>

                </div>
            </div>

        </div>
    </main>
`,

    computed: {
        entry() {
            return this.leaderboard?.[this.selected] || {
                user: '',
                total: 0,
                creatorScore: 0,
                victories: [],
                verified: [],
                created: [],
            };
        },

        // ✅ GROUP + SORT CREATOR LEVELS
        groupedCreated() {
            if (!this.entry?.created) return {};

            const order = ['Epic', 'Featured', 'Standard', 'Joke'];

            const groups = {};

            order.forEach(r => {
                groups[r] = [];
            });

            this.entry.created.forEach(lvl => {
                const rating = lvl.rating || 'Other';
                if (!groups[rating]) groups[rating] = [];
                groups[rating].push(lvl);
            });

            // remove empty groups
            return Object.fromEntries(
                Object.entries(groups).filter(([_, v]) => v.length)
            );
        }
    },

    methods: {
        localize,
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
};
