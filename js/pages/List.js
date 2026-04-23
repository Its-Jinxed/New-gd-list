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
                        v-for="(item, i) in filteredList"
                        :key="item.level?.path || i"
                    >

                        <td class="rank">
                            <p class="type-label-lg">
                                #{{ item.originalRank + 1 }}
                            </p>
                        </td>

                        <td class="level" :class="{ active: selected === item.originalRank, error: !item.level }">
                            <button @click="selected = item.originalRank">

                                <img
                                    v-if="item.level?.youtubeId"
                                    class="thumb"
                                    :src="'https://img.youtube.com/vi/' + item.level.youtubeId + '/mqdefault.jpg'"
                                />

                                <span class="type-label-lg">
                                    {{ item.level?.name || 'Error (' + item.err + '.json)' }}
                                </span>

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

                    <ul class="stats">
                        <li>
                            <div class="type-title-sm">Points when completed</div>
                            <p>{{ score(selected + 1, 100, level.percentToQualify) }}</p>
                        </li>

                        <li>
                            <div class="type-title-sm">ID</div>
                            <p>{{ level.id }}</p>
                        </li>

                        <li>
                            <div class="type-title-sm">Rating</div>
                            <p>{{ level.rating }}</p>
                        </li>
                    </ul>

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
            return this.list[this.selected]?.[0] || null;
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
            return this.list
                .map(([level, err], index) => ({
                    level,
                    err,
                    originalRank: index
                }))
                .filter(item => {
                    const lvl = item.level;

                    if (this.search) {
                        if (!lvl?.name?.toLowerCase().includes(this.search.toLowerCase())) {
                            return false;
                        }
                    }

                    if (this.selectedCreators.length) {
                        if (!lvl?.creators?.some(c => this.selectedCreators.includes(c))) {
                            return false;
                        }
                    }

                    if (this.selectedRatings.length) {
                        if (!this.selectedRatings.includes(lvl?.rating)) {
                            return false;
                        }
                    }

                    return true;
                })
                .sort((a, b) => {
                    if (this.sortMode === "length") {
                        return (b.level?.length || 0) - (a.level?.length || 0);
                    }
                    return 0;
                });
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
