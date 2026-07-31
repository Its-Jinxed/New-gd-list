import { fetchPacks, fetchList, fetchLeaderboard } from '../content.js';

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

                <div
                    v-if="currentPack"
                    class="ui-card"
                >

                    <div
                        style="display:flex;align-items:center;gap:1rem;"
                    >

                        <div
                            style="width:8px;height:70px;border-radius:6px;"
                            :style="{background: currentPack.color}"
                        ></div>

                        <div>

                            <h1>{{ currentPack.name }}</h1>

                            <div class="ui-muted">

                                {{ currentPack.points }} Points

                            </div>

                            <div style="margin-top:.75rem;">

                                {{ completedCount() }}
                                /
                                {{ currentPack.levels.length }}
                                Complete

                            </div>

                            <div class="pack-progress">

                                <div
                                    class="pack-progress-fill"
                                    :style="{
                                        width: progressFor(currentPack)+'%',
                                        background: currentPack.color
                                    }"
                                ></div>

                            </div>

                        </div>

                    </div>

                    <div class="level-list">

                        <div
                            v-for="(levelPath,i) in currentPack.levels"
                            :key="levelPath"
                            class="level-card"
                        >

                            <div class="level-status">

                                {{ isComplete(levelPath) ? "✅" : "⬜" }}

                            </div>

                            <div>

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

                        </div>

                    </div>

                </div>

            </div>

            <!-- RIGHT -->

            <div class="ui-card pack-player">

                <h2>Player</h2>

                <input
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

        selectPlayer(player) {
            this.selectedPlayer = player;
            this.playerSearch = "";
            this.showPlayerList = false;
        },

        isComplete(levelPath) {
            const level = this.getLevel(levelPath);

            if (!level || !this.selectedPlayer) return false;

            const player = this.selectedPlayer.toLowerCase();

            const isVerifier =
                (level.verifier || "").toLowerCase() === player;

            const isVictor =
                (level.victors || []).some(
                    victor => victor.toLowerCase() === player
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

        // Fast lookup table
        this.levelMap = Object.fromEntries(
            this.levels.map(level => [level.path, level])
        );
        
        // Build player list from leaderboard order
        const [leaderboard] = await fetchLeaderboard();

        this.players = leaderboard.map(entry => entry.user);

        if (this.players.length) {
            this.selectPlayer(this.players[0]);
        }

        this.packs = packs.sort((a, b) => {
            if (a.points !== b.points) {
                return a.points - b.points;
            }

            return a.name.localeCompare(b.name);
        });

        this.loading = false;

        // Hide the player list when clicking elsewhere
        document.addEventListener("click", (event) => {

            const picker = document.querySelector(".pack-player");

            if (picker && !picker.contains(event.target)) {
                this.showPlayerList = false;
            }

        });

    }

};
