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
                    </select>

                </div>

                <div v-if="filtersOpen" class="filter-panel">

                    <h4>Creators</h4>
                    <label v-for="c in uniqueCreators" :key="c">
                        <input type="checkbox" :value="c" v-model="selectedCreators">
                        {{ c }}
                    </label>

                    <h4>Ratings</h4>
                    <label v-for="r in ['Joke','Standard','Featured','Epic']" :key="r">
                        <input type="checkbox" :value="r" v-model="selectedRatings">
                        {{ r }}
                    </label>

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

                    <iframe
                        class="video"
                        :src="video"
                        frameborder="0"
                    ></iframe>

                    <!-- ✅ SAME STYLE AS LevelAuthors -->
                    <div class="level-meta-main">

                        <div class="meta-row">

                            <span class="author-tag">
                                💠 {{ score(selected + 1, 100, level?.percentToQualify) }} pts
                            </span>

                        </div>

                        <div class="meta-row">

                            <span class="author-tag">🆔 {{ level?.id || 'N/A' }}</span>
                            <span class="author-tag">⭐ {{ level?.rating || 'N/A' }}</span>
                            <span class="author-tag">⏱ {{ level?.length || 'N/A' }}</span>

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
            }

            return arr;
        }
    },

    async mounted() {
        this.list = await fetchList();
        this.editors = await fetchEditors();
        this.loading = false;
    },

    methods: {
        embed,
        score,
    },
};
