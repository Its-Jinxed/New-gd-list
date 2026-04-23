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
    }),

    template: `
        <main v-if="loading">
            <Spinner />
        </main>

        <main v-else class="page">

            <!-- SIDEBAR -->
            <div class="page-sidebar leaderboard-sidebar">

                <div
                    v-for="(entry, i) in leaderboard"
                    :key="entry.user"
                    class="ui-row user-row"
                    :class="{ active: selected === i }"
                    @click="selected = i"
                >
                    <div class="user-rank">#{{ i + 1 }}</div>

                    <div class="user-name type-label-lg">
                        {{ entry.user }}
                        <span v-if="i === 0"> 🥇</span>
                        <span v-else-if="i === 1"> 🥈</span>
                        <span v-else-if="i === 2"> 🥉</span>
                    </div>

                    <div class="ui-muted">
                        {{ localize(entry.total) }}
                    </div>
                </div>

            </div>

            <!-- PLAYER PANEL -->
            <div class="page-content player-panel">

                <div class="ui-card player-header">
                    <h1>
                        #{{ selected + 1 }} {{ entry.user }}
                    </h1>
                    <div>{{ localize(entry.total) }} pts</div>
                </div>

                <div class="pack-badges" v-if="entry.packs?.length">
                    <span
                        v-for="pack in entry.packs.filter(p => p.complete)"
                        class="pack-badge"
                        :style="{ background: pack.color || 'gold' }"
                    >
                        {{ pack.name }}
                    </span>
                </div>

                <div class="ui-card player-section">
                    <h2>Verified ({{ entry.verified.length }})</h2>

                    <div class="player-levels">
                        <div
                            v-for="score in entry.verified"
                            class="ui-row"
                        >
                            <span>#{{ score.rank }}</span>

                            <a :href="score.link" target="_blank" class="type-label-lg">
                                {{ score.level }}
                            </a>

                            <span>+{{ localize(score.score) }}</span>
                        </div>
                    </div>
                </div>

                <div class="ui-card player-section">
                    <h2>Completed ({{ entry.victories.length }})</h2>

                    <div class="player-levels">
                        <div
                            v-for="score in entry.victories"
                            class="ui-row"
                        >
                            <span>#{{ score.rank }}</span>

                            <a :href="score.link" target="_blank" class="type-label-lg">
                                {{ score.level }}
                            </a>

                            <span>+{{ localize(score.score) }}</span>
                        </div>
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

    methods: { localize },
};
