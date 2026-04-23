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
            <p class="type-label-lg">Loading packs...</p>
        </main>

        <main v-else class="packs-page">

            <!-- LEFT PANEL -->
            <aside class="packs-sidebar">

                <div class="packs-title">
                    <h2 class="type-label-lg">Packs</h2>
                </div>

                <div
                    v-for="(pack, i) in packs"
                    :key="pack.id"
                    class="pack-card"
                    :class="{ active: selectedPack === i }"
                    @click="selectedPack = i"
                    :style="{ '--pack-color': pack.color || '#888' }"
                >
                    <div class="pack-card__name type-label-lg">
                        {{ pack.name }}
                    </div>

                    <div class="pack-card__meta type-label-lg">
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
                        <h1 class="type-label-lg">{{ currentPack.name }}</h1>
                    </div>

                </div>

                <div v-if="currentPack" class="levels-list">

                    <div
                        v-for="(levelPath, index) in currentPack.levels"
                        :key="levelPath"
                        class="level-row"
                    >

                        <!-- POSITION -->
                        <div class="level-position type-label-lg">
                            #{{ index + 1 }}
                        </div>

                        <!-- NAME -->
                        <div class="level-name">
                            <a
                                v-if="getLevel(levelPath)"
                                class="type-label-lg"
                                :href="getLevel(levelPath).verification"
                                target="_blank"
                            >
                                {{ getLevel(levelPath).name }}
                            </a>

                            <span v-else class="missing type-label-lg">
                                {{ levelPath }}
                            </span>
                        </div>

                        <!-- THUMBNAIL -->
                        <div class="level-thumb">
                            <img
                                v-if="getLevel(levelPath)?.youtubeId"
                                :src="'https://img.youtube.com/vi/' + getLevel(levelPath).youtubeId + '/mqdefault.jpg'"
                                alt="thumbnail"
                            />
                            <div v-else class="thumb-placeholder"></div>
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
