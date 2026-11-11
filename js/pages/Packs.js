
import {
    fetchPacks,
    fetchList,
    fetchLeaderboard,
    getPackStats
} from '../content.js';

export default {
    data: () => ({
        packs: [],
        levels: [],
        levelMap: {},
        selectedPack: 0,
        selectedPlayer: "",
        playerSearch: "",
        players: [],
        showPlayerList: false,
        loading: true,
    }),

    template: `
        <main v-if="loading">
            <p class="type-label-lg">Loading packs...</p>
        </main>

        <main v-else class="page page-packs">

            <!-- LEFT SIDEBAR -->

            <div class="ui-card packs-sidebar">

                <div
                    v-for="(pack, i) in packs"
                    :key="pack.id"
                    class="pack-card"
                    :class="{ active: selectedPack === i }"
                    @click="selectedPack = i"
                >

                    <div class="pack-title">
                        {{ pack.name }}
                    </div>

                    <div class="pack-meta">
                        {{ completedCountFor(pack) }} / {{ pack.levels.length }}
                    </div>

                    <div class="pack-progress">
                        <div
                            class="pack-progress-fill"
                            :style="{
                                width: progressFor(pack) + '%',
                                background: pack.color
                            }"
                        ></div>
                    </div>

                </div>

            </div>

            <!-- MIDDLE -->

            <div class="pack-content">

                <div v-if="currentPack" class="pack-detail">

                    <div class="pack-heading">

                        <div
                            class="pack-heading-accent"
                            :style="{ background: currentPack.color }"
                        ></div>

                        <div class="pack-heading-info">

                            <h1>{{ currentPack.name }}</h1>

                            <div class="pack-statistics">

                                <div>
                                    <div class="ui-muted">Points</div>
                                    <div class="type-label-lg">
                                        {{ currentPack.averagePoints }}
                                    </div>
                                </div>

                                <div>
                                    <div class="ui-muted">Average Enjoyment</div>
                                    <div class="type-label-lg">
                                        {{ currentPack.averageEnjoyment.toFixed(2) }}
                                    </div>
                                </div>

                            </div>

                            <div class="pack-completion">
                                {{ completedCount() }}
                                /
                                {{ currentPack.levels.length }}
                                Complete
                            </div>

                        </div>

                    </div>

                    <!-- FULL-WIDTH PACK PROGRESS -->

                    <div class="pack-progress">
                        <div
                            class="pack-progress-fill"
                            :style="{
                                width: progressFor(currentPack) + '%',
                                background: currentPack.color
                            }"
                        ></div>
                    </div>

                    <!-- LEVELS -->

                    <div class="level-list">

                        <router-link
                            v-for="levelPath in currentPack.levels"
                            :key="levelPath"
                            class="level-card"
                            :to="{
                                path: '/',
                                query: { level: levelPath }
                            }"
                        >

                            <div class="level-status">
                                {{ isComplete(levelPath) ? "✅" : "⬜" }}
                            </div>

                            <div class="level-info">

                                <div class="type-label-lg">
                                    #{{ getRank(levelPath) }}
                                    {{ getLevel(levelPath)?.name || levelPath }}
                                </div>

                                <div class="ui-muted">
                                    {{ getLevel(levelPath)?.creators?.join(", ") }}
                                </div>

                            </div>

                            <img
                                v-if="getLevel(levelPath)?.youtubeId"
                                class="level-thumb"
                                :src="'https://img.youtube.com/vi/' + getLevel(levelPath).youtubeId + '/mqdefault.jpg'"
                            >

                        </router-link>

                    </div>

                </div>

            </div>

            <!-- RIGHT -->

            <div class="ui-card pack-player">

                <h2>Player</h2>

                <input
                    class="list-search"
                    v-model="playerSearch"
                    @focus="showPlayerList = true"
                    placeholder="Search player..."
                >

                <div
                    v-if="showPlayerList"
                    class="player-results"
                >

                    <div
                        v-for="player in filteredPlayers"
                        :key="player"
                        class="player-result"
                        @click="selectPlayer(player)"
                    >
                        {{ player }}
                    </div>

                </div>

                <div
                    v-if="selectedPlayer"
                    style="margin-top:1rem;"
                >

                    <div class="ui-muted">
                        Selected Player
                    </div>

                    <div
                        class="type-label-lg"
                        style="margin-top:.5rem;"
                    >
                        {{ selectedPlayer }}
                    </div>

                </div>

            </div>

        </main>
    `,

    computed: {

        currentPack() {
            return this.packs[this.selectedPack];
        },

        filteredPlayers() {

            if (!this.playerSearch)
                return this.players;

            return this.players.filter(player =>
                player.toLowerCase().includes(
                    this.playerSearch.toLowerCase()
                )
            );

        }

    },

    methods: {

        getLevel(path) {
            return this.levelMap[path];
        },

        getRank(path) {
            return this.levelMap[path]?.trueRank ?? "?";
        },

        handleDocumentClick(event) {
            const picker = document.querySelector(".pack-player");

            if (picker && !picker.contains(event.target)) {
                this.showPlayerList = false;
            }
        },

        selectPlayer(player) {
            this.selectedPlayer = player;
            this.playerSearch = "";
            this.showPlayerList = false;
        },

        isComplete(levelPath) {
            if (!this.selectedPlayer) {
                return true;
            }

            const level = this.getLevel(levelPath);

            if (!level) return false;

            const player = this.selectedPlayer.toLowerCase();

            const isVerifier =
                (level.verifier || "").toLowerCase() === player;

            const isVictor =
                (level.victors || []).some(
                    victor => (victor.name || "").toLowerCase() === player
                );

            return isVerifier || isVictor;
        },

        completedCount() {

            if (!this.currentPack)
                return 0;

            return this.currentPack.levels.filter(levelPath =>
                this.isComplete(levelPath)
            ).length;

        },

        completedCountFor(pack) {

            return pack.levels.filter(levelPath =>
                this.isComplete(levelPath)
            ).length;

        },

        progressFor(pack) {

            if (!pack || !pack.levels.length)
                return 0;

            return (
                this.completedCountFor(pack)
                / pack.levels.length
            ) * 100;

        }

    },

    async mounted() {

        const list = await fetchList();
        const packs = await fetchPacks();

        this.levels = list
            .filter(([lvl]) => lvl)
            .map(([lvl]) => lvl);

        this.levelMap = Object.fromEntries(
            this.levels.map(level => [level.path, level])
        );

        const [leaderboard] = await fetchLeaderboard(list, packs);

        this.players = leaderboard.map(entry => entry.user);

        // Calculate pack statistics and sort by average points
        this.packs = packs
            .map(pack => ({
                ...pack,
                ...getPackStats(pack, this.levels),
            }))
            .sort((a, b) => {

                if (a.averagePoints !== b.averagePoints) {
                    return a.averagePoints - b.averagePoints;
                }

                return a.name.localeCompare(b.name);

            });

        // Select a pack passed through the URL
        const requestedPack = this.$route.query.pack;

        if (requestedPack) {
            const index = this.packs.findIndex(
                pack => String(pack.id) === String(requestedPack)
            );

            if (index !== -1) {
                this.selectedPack = index;
            }
        }

        // Select a player passed through the URL
        const requestedPlayer = this.$route.query.player;

        if (requestedPlayer) {
            const match = this.players.find(
                player =>
                    player.toLowerCase() ===
                    String(requestedPlayer).toLowerCase()
            );

            if (match) {
                this.selectPlayer(match);
            }
        }

        this.loading = false;

        document.addEventListener(
            "click",
            this.handleDocumentClick
        );
    },

    unmounted() {

        document.removeEventListener(
            "click",
            this.handleDocumentClick
        );

    }

};
