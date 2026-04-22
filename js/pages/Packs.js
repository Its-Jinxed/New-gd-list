import { fetchPacks, fetchList } from '../content.js';

export default {
    data: () => ({
        packs: [],
        levels: [],
        selectedPack: 0,
        loading: true,
    }),

    template: `
        <main v-if="loading" class="packs-loading">
            <p>Loading packs...</p>
        </main>

        <main v-else class="packs-page">

            <!-- LEFT PANEL -->
            <aside class="packs-sidebar">

                <div class="packs-title">
                    <h2>Packs</h2>
                </div>

                <div
                    v-for="(pack, i) in packs"
                    :key="pack.id"
                    class="pack-card"
                    :class="{ active: selectedPack === i }"
                    @click="selectedPack = i"
                    :style="{ '--pack-color': pack.color || '#888' }"
                >
                    <div class="pack-card__name">
                        {{ pack.name }}
                    </div>

                    <div class="pack-card__meta">
                        {{ pack.levels.length }} levels
                    </div>

                </div>

            </aside>

            <!-- RIGHT PANEL -->
            <section class="packs-content">

                <div v-if="currentPack" class="pack-header">

                    <div
                        class="pack-header__bar"
                        :style="{ background: currentPack.color || '#888' }"
                    ></div>

                    <div class="pack-header__text">
                        <h1>{{ currentPack.name }}</h1>
                        <p>{{ currentPack.levels.length }} levels</p>
                    </div>

                </div>

                <div v-if="currentPack" class="levels-list">

                    <div
                        v-for="levelPath in currentPack.levels"
                        :key="levelPath"
                        class="level-row"
                    >

                        <!-- THUMBNAIL -->
                        <div class="level-thumb">
                            <img
                                v-if="getLevel(levelPath)?.youtubeId"
                                :src="`https://img.youtube.com/vi/${getLevel(levelPath).youtubeId}/mqdefault.jpg`"
                                alt="thumbnail"
                            />
                            <div v-else class="thumb-placeholder"></div>
                        </div>

                        <!-- NAME -->
                        <div class="level-name">

                            <a
                                v-if="getLevel(levelPath)"
                                :href="getLevel(levelPath).verification"
                                target="_blank"
                            >
                                {{ getLevel(levelPath).name }}
                            </a>

                            <span v-else class="missing">
                                {{ levelPath }}
                            </span>

                        </div>

                        <!-- STATUS -->
                        <div class="level-status">
                            <span v-if="getLevel(levelPath)">Available</span>
                            <span v-else>Missing</span>
                        </div>

                    </div>

                </div>

            </section>

        </main>
    `,

    computed: {
        currentPack() {
            return this.packs[this.selectedPack] || null;
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
