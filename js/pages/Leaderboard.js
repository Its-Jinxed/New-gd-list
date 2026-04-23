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

        // =========================
        // NEW UI STATE
        // =========================
        search: '',
        filterMode: 'all',   // all | creator | rating
        filterValue: '',
        sortMode: 'difficulty',
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

            <!-- =========================
                 SEARCH / FILTER / SORT
            ========================== -->
            <div class="list-controls">

                <input
                    v-model="search"
                    class="list-search"
                    type="text"
                    placeholder="Search users..."
                />

                <select v-model="filterMode" class="list-filter">
                    <option value="all">All</option>
                    <option value="creator">Creator</option>
                    <option value="rating">Rating</option>
                </select>

                <select
                    v-model="filterValue"
                    class="list-filter"
                    v-if="filterMode !== 'all'"
                >
                    <option
                        v-for="opt in filterOptions"
                        :key="opt"
                        :value="opt"
                    >
                        {{ opt }}
                    </option>
                </select>

                <select v-model="sortMode" class="list-filter">
                    <option value="difficulty">Difficulty</option>
                    <option value="length">Length</option>
                </select>

            </div>

            <!-- LEFT -->
            <div class="board-container">
                <table class="board">
                    <tr
                        v-for="(entry, i) in filteredLeaderboard"
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

            <!-- RIGHT -->
            <div class="player-container" v-if="entry">
                <div class="player">

                    <h1 class="lb-title">
                        #{{ selected + 1 }} {{ entry.user }} —
                        {{ localize(entry.displayScore || 0) }} pts
                    </h1>

                    <!-- PACKS -->
                    <div
                        class="pack-badges"
                        v-if="completedPacks(entry).length"
                    >
                        <span
                            v-for="pack in completedPacks(entry)"
                            :key="pack.name"
                            class="pack-badge complete"
                            :style="{ background: pack.color || 'gold' }"
                        >
                            {{ pack.name }}
                        </span>
                    </div>

                    <!-- VERIFIED -->
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

                    <!-- COMPLETED -->
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

                </div>
            </div>

        </div>
    </main>
`,

    computed: {
        entry() {
            return this.filteredLeaderboard?.[this.selected] || {
                user: '',
                total: 0,
                victories: [],
                verified: [],
                packs: [],
                creatorScore: 0,
                displayScore: 0,
            };
        },

        // =========================
        // FILTER OPTIONS
        // =========================
        filterOptions() {
            const list = this.leaderboard || [];

            if (this.filterMode === 'creator') {
                const creators = new Set();
                list.forEach(l => {
                    (l.creators || []).forEach(c => creators.add(c));
                });
                return [...creators];
            }

            if (this.filterMode === 'rating') {
                return ['Joke', 'Standard', 'Featured', 'Epic'];
            }

            return [];
        },

        // =========================
        // MAIN PIPELINE
        // =========================
        filteredLeaderboard() {
            let list = [...this.leaderboard];

            // SEARCH
            if (this.search.trim()) {
                const s = this.search.toLowerCase();
                list = list.filter(l =>
                    l.user?.toLowerCase().includes(s)
                );
            }

            // FILTER
            if (this.filterMode === 'creator' && this.filterValue) {
                list = list.filter(l =>
                    (l.creators || []).includes(this.filterValue)
                );
            }

            if (this.filterMode === 'rating' && this.filterValue) {
                list = list.filter(l =>
                    l.rating === this.filterValue
                );
            }

            // SORT
            if (this.sortMode === 'length') {
                list.sort((a, b) => (a.length || 0) - (b.length || 0));
            } else {
                list = list.map((p, i) => ({ ...p, _i: i }));
                list.sort((a, b) => a._i - b._i);
            }

            return list;
        },
    },

    methods: {
        localize,

        completedPacks(entry) {
            return (entry.packs || []).filter(p => p.complete);
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
};
