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
                <h2>{{ pack.name }}</h2>

                <table class="table">
                    <tr v-for="levelPath in pack.levels">
                        <td>
                            <a :href="getLevel(levelPath)?.verification" target="_blank">
                                {{ getLevel(levelPath)?.name || levelPath }}
                            </a>
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
