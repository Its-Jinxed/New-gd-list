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

        // =====================
        // FILTER STATE (UPDATED)
        // =====================
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

                <!-- CONTROLS -->
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

                <!-- DROPDOWN FILTER PANEL -->
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

                <!-- LIST -->
                <table class="list" v-if="filteredList">
                    <tr v-for="([level, err], i) in filteredList" :key="level?.id || i">

                        <td class="rank">
                            <p v-if="i + 1 <= 150" class="type-label-lg">#{{ i + 1 }}</p>
                            <p v-else class="type-label-lg">Legacy</p>
                        </td>

                        <td class="level" :class="{ active: selected === i, error: !level }">
                            <button @click="selected = i">

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
                        id="videoframe"
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

                <div v-else class="level">
                    <p>(ノಠ益ಠ)ノ彡┻━┻</p>
                </div>

            </section>

            <!-- RIGHT -->
            <aside class="app-right">

                <div v-if="level">

                    <h2>Victors</h2>

                    <table class="victors" v-if="level.victors && level.victors.length">
                        <tr v-for="victor in level.victors" :key="victor">
                            <td>
                                <span class="type-label-lg">
                                    {{ victor }}
                                </span>
                            </td>
                        </tr>
                    </table>

                    <p v-else>No victors yet.</p>

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

            // SEARCH
            if (this.search) {
                arr = arr.filter(([lvl]) =>
                    lvl?.name?.toLowerCase().includes(this.search.toLowerCase())
                );
            }

            // CREATOR FILTER
            if (this.selectedCreators.length) {
                arr = arr.filter(([lvl]) =>
                    lvl?.creators?.some(c =>
                        this.selectedCreators.includes(c)
                    )
                );
            }

            // RATING FILTER
            if (this.selectedRatings.length) {
                arr = arr.filter(([lvl]) =>
                    this.selectedRatings.includes(lvl?.rating)
                );
            }

            // SORT
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

        if (!this.list) {
            this.errors = [
                "Failed to load list. Retry in a few minutes or notify list staff.",
            ];
        } else {
            this.errors.push(
                ...this.list
                    .filter(([_, err]) => err)
                    .map(([_, err]) => `Failed to load level. (${err}.json)`)
            );

            if (!this.editors) {
                this.errors.push("Failed to load list editors.");
            }
        }

        this.loading = false;
    },

    methods: {
        embed,
        score,
    },
};
