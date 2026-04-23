import { store } from "../main.js";
import { embed } from "../util.js";
import { score } from "../score.js";
import { fetchEditors, fetchList } from "../content.js";

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
        loading: true,

        // FIX: store actual level, not index
        selectedLevel: null,

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
                    </select>

                </div>

                <div v-if="filtersOpen" class="filter-panel">

                    <h4>Creators</h4>
                    <label v-for="c in uniqueCreators" :key="c">
                        <input type="checkbox" :value="c" v-model="selectedCreators">
                        {{ c }}
                    </label>

                    <h4>Ratings</h4>

                    <div class="filter-group">
                        <label>
                            <input type="checkbox" value="Joke" v-model="selectedRatings">
                            Joke
                        </label>

                        <label>
                            <input type="checkbox" value="Standard" v-model="selectedRatings">
                            Standard
                        </label>
                    </div>

                    <div class="filter-separator"></div>

                    <div class="filter-group">
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

                    <tr
                        v-for="([level, err], i) in filteredList"
                        :key="level?.path || i"
                    >

                        <td class="rank">
                            <p v-if="level" class="type-label-lg">
                                #{{ i + 1 }}
                            </p>
                        </td>

                        <td class="level" :class="{ active: selectedLevel === level, error: !level }">

                            <button @click="selectedLevel = level">

                                <img
                                    v-if="level?.youtubeId"
                                    class="thumb"
                                    :src="'https://img.youtube.com/vi/' + level.youtubeId + '/mqdefault.jpg'"
                                />

                                <span class="type-label-lg">
                                    {{ level?.name || 'Error (' + err + '.json)' }}
                                </span>

                            </button>

                        </td>

                    </tr>

                </table>

            </aside>

            <section class="app-main">

                <div v-if="level" class="level">

                    <h1>{{ level.name }}</h1>

                    <LevelAuthors
                        :creators="level.creators"
                        :verifier="level.verifier"
                    />

                    <iframe
                        class="video"
                        :src="video"
                        frameborder="0"
                    ></iframe>

                </div>

            </section>

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
        // FIX: direct object, not index-based
        level() {
            return this.selectedLevel || this.filteredList?.[0]?.[0] || null;
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
                arr = arr.sort((a, b) =>
                    (b[0]?.length || 0) - (a[0]?.length || 0)
                );
            }

            return arr;
        }
    },

    async mounted() {
        this.list = await fetchList();
        this.editors = await fetchEditors();

        // FIX: auto-select first visible level
        this.selectedLevel = this.list?.[0]?.[0] || null;

        this.loading = false;
    },

    methods: {
        embed,
        score,
    },
};
