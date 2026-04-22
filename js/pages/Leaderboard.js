import { fetchLeaderboard } from '../content.js';
import { localize } from '../util.js';

import Spinner from '../components/Spinner.js';

export default {
    components: {
        Spinner,
    },
    data: () => ({
        leaderboard: [],
        loading: true,
        selected: 0,
        err: [],
    }),

    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>

        <main v-else class="page-leaderboard-container">
            <div class="page-leaderboard">

                <div class="error-container">
                    <p class="error" v-if="err.length > 0">
                        Leaderboard may be incorrect, as the following levels could not be loaded: {{ err.join(', ') }}
                    </p>
                </div>

                <!-- LEADERBOARD TABLE -->
                <div class="board-container">
                    <table class="board">
                        <tr v-for="(ientry, i) in leaderboard">
                            
                            <td class="rank">
                                <p class="type-label-lg">#{{ i + 1 }}</p>
                            </td>

                            <td class="user" :class="{ 'active': selected == i }">
                                <button @click="selected = i">
                                    <span class="type-label-lg">
                                        #{{ i + 1 }} {{ ientry.user }} — {{ localize(ientry.total) }} pts
                                    </span>
                                </button>
                            </td>

                        </tr>
                    </table>
                </div>

                <!-- PLAYER PANEL -->
                <div class="player-container">
                    <div class="player">

                        <!-- HEADER -->
                        <h1>
                            #{{ selected + 1 }} {{ entry.user }} —
                            {{ localize(entry.total) }} pts
                        </h1>

                        <!-- PACK BADGES -->
                        <div class="pack-badges" v-if="entry.packs && entry.packs.length">
                            <span
                                v-for="pack in entry.packs.filter(p => p.complete)"
                                class="pack-badge"
                                :style="{ background: pack.color || 'gold' }"
                            >
                                {{ pack.name }}
                            </span>
                        </div>

                        <!-- COMPLETED -->
                        <h2 v-if="entry.victories && entry.victories.length > 0">
                            Completed ({{ entry.victories.length }})
                        </h2>

                        <table class="table" v-if="entry.victories && entry.victories.length > 0">
                            <tr v-for="score in entry.victories">
                                <td class="rank">
                                    <p>#{{ score.rank }}</p>
                                </td>
                                <td class="level">
                                    <a class="type-label-lg" target="_blank" :href="score.link">
                                        {{ score.level }}
                                    </a>
                                </td>
                                <td class="score">
                                    <p>+{{ localize(score.score) }}</p>
                                </td>
                            </tr>
                        </table>

                        <p v-else>No victories yet.</p>

                        <!-- VERIFIED -->
                        <h2 v-if="entry.verified && entry.verified.length > 0">
                            Verified ({{ entry.verified.length }})
                        </h2>

                        <table class="table" v-if="entry.verified && entry.verified.length > 0">
                            <tr v-for="score in entry.verified">
                                <td class="rank">
                                    <p>#{{ score.rank }}</p>
                                </td>
                                <td class="level">
                                    <a class="type-label-lg" target="_blank" :href="score.link">
                                        {{ score.level }}
                                    </a>
                                </td>
                                <td class="score">
                                    <p>+{{ localize(score.score) }}</p>
                                </td>
                            </tr>
                        </table>

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
            };
        },
    },

    async mounted() {
        const [leaderboard, err] = await fetchLeaderboard();
        this.leaderboard = leaderboard;
        this.err = err;
        this.loading = false;
    },

    methods: {
        localize,
    },
};
