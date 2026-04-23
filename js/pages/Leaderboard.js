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
        mode: 'total', // total | creator
    }),

    template: `
        <main v-if="loading">
            <Spinner />
        </main>

        <main v-else class="page-leaderboard-container">
            <div class="page-leaderboard">

                <!-- ERROR -->
                <div class="error-container">
                    <p class="error" v-if="err.length">
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
                        <tr v-for="(entry, i) in sortedLeaderboard" :key="entry.user">

                            <td class="rank">
                                <p class="type-label-lg">#{{ i + 1 }}</p>
                            </td>

                            <td class="user" :class="{ active: selected == i }">
                                <button @click="selected = i">
                                    <span class="type-label-lg">
                                        {{ entry.user }} — {{ localize(entry.displayScore) }} pts

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
                <div class="player-container">
                    <div class="player">

                        <h1>
                            #{{ selected + 1 }} {{ entry.user }} —
                            {{ localize(entry.displayScore) }} pts
                        </h1>

                        <!-- PACK CHIPS -->
                        <div class="pack-badges" v-if="entry.packs?.length">
                            <span
                                v-for="pack in entry.packs"
                                :key="pack.name"
                                class="pack-badge"
                                :class="{ complete: pack.complete }"
                                :style="{ background: pack.complete ? (pack.color || 'gold') : 'transparent' }"
                            >
                                {{ pack.name }}
                            </span>
                        </div>

                        <!-- VERIFIED -->
                        <h2 v-if="entry.verified.length">
                            Verified ({{ entry.verified.length }})
                        </h2>

                        <table v-if="entry.verified.length">
                            <tr v-for="score in entry.verified" :key="score.level">
                                <td class="rank"><p>#{{ score.rank }}</p></td>
                                <td class="level">
                                    <a :href="score.link" target="_blank">
                                        {{ score.level }}
                                    </a>
                                </td>
                                <td class="score">
                                    <p>+{{ localize(score.score) }}</p>
                                </td>
                            </tr>
                        </table>

                        <p v-else>No verified levels.</p>

                        <!-- VICTORIES -->
                        <h2 v-if="entry.victories.length">
                            Completed ({{ entry.victories.length }})
                        </h2>

                        <table v-if="entry.victories.length">
                            <tr v-for="score in entry.victories" :key="score.level">
                                <td class="rank"><p>#{{ score.rank }}</p></td>
                                <td class="level">
                                    <a :href="score.link" target="_blank">
                                        {{ score.level }}
                                    </a>
                                </td>
                                <td class="score">
                                    <p>+{{ localize(score.score) }}</p>
                                </td>
                            </tr>
                        </table>

                        <p v-else>No completed levels yet.</p>

                    </div>
                </div>

            </div>
        </main>
    `,

    computed: {
        entry() {
            return this.leaderboard[this.selected] || {
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
            const list = [...this.leaderboard];

            return list
                .map(p => ({
                    ...p,
                    displayScore: this.mode === 'creator'
                        ? (p.creatorScore || 0)
                        : p.total
                }))
                .sort((a, b) => b.displayScore - a.displayScore);
        }
    },

    async mounted() {
        const [leaderboard, err] = await fetchLeaderboard();
        this.leaderboard = leaderboard;
        this.err = err;
        this.loading = false;
    },

    methods: { localize },
};
