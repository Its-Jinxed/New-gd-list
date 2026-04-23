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
                    <tr v-for="(entry, i) in sortedLeaderboard" :key="entry.user || i">

                        <td class="rank">
                            <p>#{{ i + 1 }}</p>
                        </td>

                        <td class="user" :class="{ active: selected === i }">
                            <button @click="selected = i">
                                {{ entry.user }} —
                                {{ localize(entry.displayScore || 0) }} pts
                            </button>
                        </td>

                    </tr>
                </table>
            </div>

            <!-- RIGHT -->
            <div class="player-container" v-if="entry">

                <h1>
                    #{{ selected + 1 }} {{ entry.user }} —
                    {{ localize(entry.displayScore || 0) }} pts
                </h1>

                <!-- PACKS -->
                <div class="pack-badges" v-if="completedPacks(entry).length">
                    <span
                        v-for="pack in completedPacks(entry)"
                        :key="pack.name"
                        class="pack-badge complete"
                        :style="{ background: pack.color || 'gold' }"
                    >
                        {{ pack.name }}
                    </span>
                </div>

            </div>

        </div>
    </main>
`,

    computed: {
        entry() {
            return this.sortedLeaderboard?.[this.selected] || null;
        },

        sortedLeaderboard() {
            return [...(this.leaderboard || [])]
                .map(p => ({
                    ...p,
                    displayScore:
                        this.mode === 'creator'
                            ? p.creatorScore
                            : p.total,
                }))
                .sort((a, b) => (b.displayScore || 0) - (a.displayScore || 0));
        },
    },

    methods: {
        localize,

        completedPacks(entry) {
            return (entry?.packs || []).filter(p => p.complete);
        },
    },

    async mounted() {
        try {
            const result = await fetchLeaderboard();

            if (Array.isArray(result)) {
                const [data, err] = result;

                this.leaderboard = data || [];
                this.err = err || [];
            }
        } catch (e) {
            console.error(e);
            this.err = ['fatal_error'];
        } finally {
            this.loading = false;
        }
    },
};
