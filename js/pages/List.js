import { store } from "../main.js";
import { embed } from "../util.js";
import { score } from "../score.js";
import { fetchEditors, fetchList, fetchPacks } from "../content.js";

import Spinner from "../components/Spinner.js";
import LevelAuthors from "../components/List/LevelAuthors.js";

const roleIconMap = {
    owner: "crown",
    admin: "user-gear",
    helper: "user-shield",
    dev: "code",
    trial: "user-lock",
};

export default {
    components: { Spinner, LevelAuthors },

    data: () => ({
        list: [],
        editors: [],
        packs: [],

        loading: true,
        selected: 0,
        errors: [],
        roleIconMap,
        store,

        search: "",
        selectedCreators: [],
        selectedRatings: [],
        sortMode: "difficulty",
        filtersOpen: false,
    }),

    template: `
        <main v-if="loading">
            <Spinner />
        </main>

        <main v-else class="app-shell page-list">

            <!-- LEFT -->
            <aside class="app-sidebar">

                <div class="list-controls">

                    <input
                        v-model="search"
                        type="text"
                        placeholder="Search levels..."
                        class="list-search"
                    />

                    <button class="list-filter" @click="filtersOpen = !filtersOpen">
                        Filters
                    </button>

                    <select v-model="sortMode" class="list-filter">
                        <option value="difficulty">Difficulty</option>
                        <option value="length">Length</option>
                        <option value="date">Date</option>
                    </select>

                </div>

                <div v-if="filtersOpen" class="filter-panel">

                    <h4>Creators</h4>
                    <label v-for="c in uniqueCreators" :key="c">
                        <input type="checkbox" :value="c" v-model="selectedCreators">
                        {{ c }}
                    </label>

                    <h4>Ratings</h4>

                    <div class="rating-row">
                        <label>
                            <input type="checkbox" value="Joke" v-model="selectedRatings">
                            Joke
                        </label>

                        <label>
                            <input type="checkbox" value="Standard" v-model="selectedRatings">
                            Standard
                        </label>
                    </div>

                    <div class="rating-row">
                        <label>
                            <input type="checkbox" value="Featured" v-model="selectedRatings">
                            Featured
                        </label>

                        <label>
                            <input type="checkbox" value="Epic" v-model="selectedRatings">
                            Epic
                        </label>
                    </div>

                </div>

                <table class="list" v-if="filteredList">

                    <tr v-for="([level, err], i) in filteredList" :key="level?.path || i">

                        <td class="rank">
                            <p v-if="level" class="type-label-lg">
                                #{{ level.trueRank }}
                            </p>
                        </td>

                        <td class="level" :class="{ active: selected === i, error: !level }">
                            <button @click="selected = i">

                                <img
                                    v-if="level?.youtubeId"
                                    class="thumb"
                                    :src="'https://img.youtube.com/vi/' + level.youtubeId + '/mqdefault.jpg'"
                                />

                                <div class="level-text">
                                    <span class="type-label-lg">
                                        {{ level?.name || 'Error (' + err + '.json)' }}
                                    </span>
                                </div>

                            </button>
                        </td>

                    </tr>
                </table>

            </aside>

            <!-- MIDDLE -->
            <section class="app-main">

                <div v-if="level" class="level">

                    <h1>{{ level.name }}</h1>

                    <LevelAuthors
                        :creators="level.creators"
                        :verifier="level.verifier"
                    />

                    <!-- ✅ PACK CHIPS -->
                    <div class="pack-badges" v-if="levelPacks.length">
                        <span
                            v-for="pack in levelPacks"
                            :key="pack.id"
                            class="pack-badge"
                            :style="{ background: pack.color || 'gold' }"
                        >
                            {{ pack.name }}
                        </span>
                    </div>

                    <iframe
                        class="video"
                        :src="video"
                        frameborder="0"
                    ></iframe>

                    <!-- POINTS -->
                    <div class="level-meta-main">

                        <div class="type-title-sm">Points</div>
                        <p class="type-body">
                            <span>
                                {{ score(level.trueRank, 100, level?.percentToQualify) }}
                            </span>
                        </p>

                        <div class="type-title-sm">Details</div>
                        <div class="meta-row">

                            <p class="type-body">
                                <span>ID: {{ level?.id || 'N/A' }}</span>
                            </p>

                            <p class="type-body">
                                <span>Rating: {{ level?.rating || 'N/A' }}</span>
                            </p>

                            <p class="type-body">
                                <span>Length: {{ level?.lengthDisplay || level?.length || 'N/A' }}</span>
                            </p>

                        </div>

                    </div>

                </div>

            </section>

            <!-- RIGHT -->
            <aside class="app-right">

                <div v-if="level">

                    <h2>Victors</h2>

                    <table v-if="level.victors?.length">
                        <tr v-for="victor in level.victors" :key="victor">
                            <td>{{ victor }}</td>
                        </tr>
                    </table>

                </div>

            </aside>

        </main>
    `,

    computed: {
        level() {
            return this.filteredList[this.selected]?.[0];
        },

        video() {
            if (!this.level) return "";
            return embed(this.level.showcase || this.level.verification);
        },

        uniqueCreators() {
            const set = new Set();
            this.list.forEach(([lvl]) => {
                (lvl?.creators || []).forEach(c => set.add(c));
            });
            return [...set].sort();
        },

        filteredList() {
            let arr = [...this.list];

            if (this.search) {
                arr = arr.filter(([lvl]) =>
                    lvl?.name?.toLowerCase().includes(this.search.toLowerCase())
                );
            }

            if (this.selectedCreators.length) {
                arr = arr.filter(([lvl]) =>
                    lvl?.creators?.some(c => this.selectedCreators.includes(c))
                );
            }

            if (this.selectedRatings.length) {
                arr = arr.filter(([lvl]) =>
                    this.selectedRatings.includes(lvl?.rating)
                );
            }

            if (this.sortMode === "length") {
                arr.sort((a, b) =>
                    (b[0]?.length || 0) - (a[0]?.length || 0)
                );
            } else if (this.sortMode === "date") {
                arr.sort((a, b) =>
                    (b[0]?.id || 0) - (a[0]?.id || 0)
                );
            }

            return arr;
        },

        // ✅ NEW: packs for current level
        levelPacks() {
            if (!this.level?.path || !this.packs.length) return [];

            return this.packs
                .filter(pack => (pack.levels || []).includes(this.level.path))
                .sort((a, b) => (b.points || 0) - (a.points || 0));
        }
    },

    async mounted() {
        this.list = await fetchList();
        this.editors = await fetchEditors();
        this.packs = await fetchPacks();
        this.loading = false;
    },

    methods: {
        embed,
        score,
    },
};
