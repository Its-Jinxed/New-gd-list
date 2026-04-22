import { fetchPacks, fetchList } from '../content.js';

export default {
    data: () => ({
        packs: [],
        levels: [],
        loading: true,
    }),

    template: `
        <main v-if="loading">
            <p>Loading packs...</p>
        </main>

        <main v-else class="page-packs">

            <div v-for="pack in packs" class="pack">

                <!-- PACK HEADER -->
                <div
                    class="pack-header"
                    :style="{ borderColor: pack.color || '#999' }"
                >
                    <h2>
                        {{ pack.name }}
                    </h2>

                    <span class="pack-count">
                        {{ pack.levels.length }} levels
                    </span>
                </div>

                <!-- LEVEL LIST -->
                <table class="table">
                    <tr v-for="levelPath in pack.levels">

                        <td class="level-name">
                            <a
                                :href="getLevel(levelPath)?.verification"
                                target="_blank"
                                v-if="getLevel(levelPath)"
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

        </main>
    `,

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
