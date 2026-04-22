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
            <p>Loading packs...</p>
        </main>

        <main v-else class="packs-layout">

            <!-- LEFT SIDEBAR -->
            <aside class="packs-sidebar">
                <div
                    v-for="(pack, i) in packs"
                    :key="pack.id"
                    class="pack-item"
                    :class="{ active: selectedPack === i }"
                    @click="selectedPack = i"
                    :style="{ borderLeftColor: pack.color || '#999' }"
                >
                    <div class="pack-name">
                        {{ pack.name }}
                    </div>

                    <div class="pack-sub">
                        {{ pack.levels.length }} levels
                    </div>
                </div>
            </aside>

            <!-- RIGHT CONTENT -->
            <section class="pack-content">

                <div v-if="currentPack">

                    <h1
                        class="pack-title"
                        :style="{ color: currentPack.color || 'black' }"
                    >
                        {{ currentPack.name }}
                    </h1>

                    <p class="pack-meta">
                        {{ currentPack.levels.length }} levels
                    </p>

                    <table class="table">
                        <tr v-for="levelPath in currentPack.levels">

                            <td class="level-name">
                                <a
                                    v-if="getLevel(levelPath)"
                                    :href="getLevel(levelPath).verification"
                                    target="_blank"
                                >
                                    {{ getLevel(levelPath).name }}
                                </a>

                                <span v-else>
                                    {{ levelPath }}
                                </span>
                            </td>

                            <td class="level-status">
                                <span v-if="getLevel(levelPath)">
                                    Available
                                </span>
                                <span v-else>
                                    Missing
                                </span>
                            </td>

                        </tr>
                    </table>

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
