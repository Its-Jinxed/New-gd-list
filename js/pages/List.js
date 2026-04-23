import { store } from "../main.js";
import { embed } from "../util.js";
import { score } from "../score.js";
import { fetchEditors, fetchList } from "../content.js";

import Spinner from "../components/Spinner.js";
import LevelAuthors from "../components/List/LevelAuthors.js";

export default {
    components: { Spinner, LevelAuthors },

    template: `
        <main v-if="loading">
            <Spinner />
        </main>

        <main v-else class="page page-list">

            <!-- LEFT LIST -->
            <div class="page-sidebar list-container">

                <div
                    v-for="([level, err], i) in list"
                    :key="i"
                    class="ui-row level-row"
                    :class="{ active: selected === i, error: !level }"
                    @click="selected = i"
                >
                    <div class="type-label-lg">
                        {{ i + 1 <= 150 ? '#' + (i + 1) : 'Legacy' }}
                    </div>

                    <img
                        v-if="level?.youtubeId"
                        :src="'https://img.youtube.com/vi/' + level.youtubeId + '/mqdefault.jpg'"
                    />

                    <div class="type-label-lg">
                        {{ level?.name || 'Error (' + err + '.json)' }}
                    </div>
                </div>

            </div>

            <!-- RIGHT PANEL -->
            <div class="page-content level-detail">

                <div v-if="level" class="ui-card">

                    <h1>{{ level.name }}</h1>

                    <LevelAuthors
                        :creators="level.creators"
                        :verifier="level.verifier"
                    />

                    <iframe
                        class="level-video"
                        :src="video"
                        frameborder="0"
                    ></iframe>

                    <div class="level-stats">
                        <div>
                            <div class="type-title-sm">Points</div>
                            <p>{{ score(selected + 1, 100, level.percentToQualify) }}</p>
                        </div>

                        <div>
                            <div class="type-title-sm">ID</div>
                            <p>{{ level.id }}</p>
                        </div>

                        <div>
                            <div class="type-title-sm">Rating</div>
                            <p>{{ level.rating }}</p>
                        </div>
                    </div>

                    <div class="ui-card">
                        <h2>Victors ({{ level.victors.length }})</h2>

                        <div class="level-victors">
                            <div
                                v-for="victor in level.victors"
                                class="ui-row"
                            >
                                {{ victor }}
                            </div>
                        </div>
                    </div>

                </div>

                <div v-else class="ui-card" style="display:flex;align-items:center;justify-content:center;">
                    <p>(ノಠ益ಠ)ノ彡┻━┻</p>
                </div>

            </div>

        </main>
    `,

    data: () => ({
        list: [],
        editors: [],
        loading: true,
        selected: 0,
        errors: [],
        store
    }),

    computed: {
        level() {
            return this.list[this.selected]?.[0];
        },
        video() {
            if (!this.level) return "";
            return embed(this.level.showcase || this.level.verification);
        },
    },

    async mounted() {
        this.list = await fetchList();
        this.editors = await fetchEditors();
        this.loading = false;
    },

    methods: { embed, score }
};
