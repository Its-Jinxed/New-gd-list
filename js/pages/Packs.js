import { fetchPacks, fetchList } from '../content.js';

export default {
    data: () => ({
        packs: [],
        levels: [],
        levelMap: {},
        selectedPack: 0,
        selectedPlayer: "",
        players: [],
        loading: true,
    }),

    template: `
        <main v-if="loading">
            <p class="type-label-lg">Loading packs...</p>
        </main>

        <main v-else class="page">

            <!-- LEFT SIDEBAR -->
            <div class="page-sidebar">

                <div
                    v-for="(pack, i) in packs"
                    :key="pack.id"
                    class="ui-row"
                    :class="{ active: selectedPack === i }"
                    @click="selectedPack = i"
                >
                    <div>
                        <div class="type-label-lg">{{ pack.name }}</div>
                        <div class="ui-muted">{{ pack.levels.length }} Levels</div>
                    </div>
                </div>

            </div>

            <!-- CENTRE PANEL -->
            <div class="page-content">

                <div
                    v-if="currentPack"
                    class="ui-card"
                >

                    <div
                        style="
                            display:flex;
                            align-items:center;
                            gap:1rem;
                        "
                    >

                        <div
                            style="width:8px;height:60px;border-radius:6px;"
                            :style="{ background: currentPack.color || '#888' }"
                        ></div>

                        <div>

                            <h1>{{ currentPack.name }}</h1>

                            <div class="ui-muted">

                                {{ currentPack.points }} Points •
                                {{ currentPack.levels.length }} Levels

                            </div>

                        </div>

                    </div>

                    <div
                        style="
                            margin-top:1.5rem;
                            padding:1rem;
                            border-radius:10px;
                            background:#222;
                        "
                    >

                        <div class="type-label-lg">
                            Progress for {{ selectedPlayer }}
                        </div>

                        <div style="margin-top:8px;">
                            {{ completedCount() }} / {{ currentPack.levels.length }}
                            Complete
                        </div>

                        <progress
                            :value="completedCount()"
                            :max="currentPack.levels.length"
                            style="width:100%;margin-top:10px;"
                        ></progress>

                    </div>

                    <div
                        style="
                            margin-top:1.5rem;
                            display:flex;
                            flex-direction:column;
                            gap:0.75rem;
                        "
                    >

                        <div
                            v-for="(levelPath, i) in currentPack.levels"
                            :key="levelPath"
                            class="ui-row"
                        >

                            <span style="font-size:1.2rem;">
                                {{ isComplete(levelPath) ? "✅" : "⬜" }}
                            </span>

                            <span>#{{ i + 1 }}</span>

                            <span class="type-label-lg">
                                {{ getLevel(levelPath)?.name || levelPath }}
                            </span>

                            <img
                                v-if="getLevel(levelPath)?.youtubeId"
                                :src="'https://img.youtube.com/vi/' + getLevel(levelPath).youtubeId + '/mqdefault.jpg'"
                                style="width:120px;border-radius:8px;margin-left:auto;"
                            />

                        </div>

                    </div>

                </div>

            </div>

            <!-- RIGHT SIDEBAR -->

            <div
                class="page-sidebar"
                style="min-width:220px;"
            >

                <h2>Progress</h2>

                <select
                    v-model="selectedPlayer"
                    style="
                        width:100%;
                        margin-top:1rem;
                        padding:0.6rem;
                    "
                >

                    <option
                        v-for="player in players"
                        :key="player"
                        :value="player"
                    >
                        {{ player }}
                    </option>

                </select>

            </div>

        </main>
    `,

    computed: {

        currentPack() {
            return this.packs[this.selectedPack];
        }

    },

    methods: {

        getLevel(path) {
            return this.levelMap[path];
        },

        isComplete(levelPath) {

            const level = this.getLevel(levelPath);

            if (!level) return false;

            return (level.victors || []).includes(this.selectedPlayer);

        },

        completedCount() {

            if (!this.currentPack) return 0;

            return this.currentPack.levels.filter(levelPath =>
                this.isComplete(levelPath)
            ).length;

        }

    },

    async mounted() {

        const list = await fetchList();
        const packs = await fetchPacks();

        this.levels = list
            .filter(([lvl]) => lvl)
            .map(([lvl]) => lvl);

        // Build a fast lookup table
        this.levelMap = Object.fromEntries(
            this.levels.map(level => [level.path, level])
        );

        // Build player list
        const players = new Set();

        this.levels.forEach(level => {

            (level.victors || []).forEach(player => {
                players.add(player);
            });

        });

        this.players = [...players].sort();

        this.selectedPlayer = this.players[0] || "";

        this.packs = packs;

        this.loading = false;

    }

};
