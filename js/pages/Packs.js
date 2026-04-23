import { fetchPacks, fetchList } from '../content.js';

export default {
    data: () => ({
        packs: [],
        levels: [],
        selectedPack: 0,
        loading: true,
    }),

    template: `
        <main v-if="loading">
            <p class="type-label-lg">Loading packs...</p>
        </main>

        <main v-else class="page">

            <!-- SIDEBAR -->
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
                        <div class="ui-muted">{{ pack.levels.length }} levels</div>
                    </div>
                </div>

            </div>

            <!-- CONTENT -->
            <div class="page-content">

                <div v-if="currentPack" class="ui-card">

                    <div style="display:flex;align-items:center;gap:1rem;">
                        <div style="width:8px;height:50px;border-radius:6px;"
                             :style="{ background: currentPack.color || '#888' }">
                        </div>

                        <h1>{{ currentPack.name }}</h1>
                    </div>

                    <div style="margin-top:1.5rem; display:flex; flex-direction:column; gap:0.75rem;">

                        <div
                            v-for="(levelPath, i) in currentPack.levels"
                            :key="levelPath"
                            class="ui-row"
                        >
                            <span>#{{ i + 1 }}</span>

                            <span class="type-label-lg">
                                {{ getLevel(levelPath)?.name || levelPath }}
                            </span>

                            <img
                                v-if="getLevel(levelPath)?.youtubeId"
                                :src="'https://img.youtube.com/vi/' + getLevel(levelPath).youtubeId + '/mqdefault.jpg'"
                                style="width:120px;border-radius:8px;"
                            />
                        </div>

                    </div>

                </div>

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
            return this.levels.find(l => l.path === path);
        }
    },

    async mounted() {
        const list = await fetchList();
        const packs = await fetchPacks();

        this.levels = list
            .filter(([lvl]) => lvl)
            .map(([lvl]) => lvl);

        this.packs = packs;
        this.loading = false;
    }
};
