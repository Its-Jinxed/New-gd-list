
import {
    fetchPositionHistory,
    fetchHistoricalLevel,
    getHistoricalSnapshot,
    getLevelHistory
} from "../content.js";

import { embed } from "../util.js";
import { score } from "../score.js";

import Spinner from "../components/Spinner.js";
import LevelAuthors from "../components/List/LevelAuthors.js";

export default {

    components: {
        Spinner,
        LevelAuthors
    },

    data: () => ({

        history: [],
        snapshotIndex: -1,

        selectedDate: "",
        selectedPath: null,
        selectedLegacy: false,

        levels: [],
        legacyLevels: [],

        search: "",
        loading: true,
        loadingLevels: false,
        error: "",
        requestId: 0

    }),

    template: `
        <main v-if="loading">
            <Spinner />
        </main>

        <main v-else-if="error" class="tm-error">
            <h2>Time Machine</h2>
            <p>{{ error }}</p>
        </main>

        <main v-else class="app-shell page-list page-timemachine">

            <!-- LEFT SIDEBAR -->

            <aside class="app-sidebar">

                <h2>Time Machine</h2>

                <div class="tm-controls">

                    <label class="tm-label">
                        Select a date
                    </label>

                    <input
                        class="tm-date"
                        type="date"
                        v-model="selectedDate"
                        :min="minDate"
                        :max="maxDate"
                        @change="changeDate"
                    />

                    <div class="tm-navigation">

                        <button
                            class="tm-button"
                            :disabled="snapshotIndex <= 0"
                            @click="selectSnapshot(snapshotIndex - 1)"
                        >
                            ← Previous
                        </button>

                        <button
                            class="tm-button"
                            :disabled="snapshotIndex >= history.length - 1"
                            @click="selectSnapshot(snapshotIndex + 1)"
                        >
                            Next →
                        </button>

                    </div>

                    <input
                        class="tm-slider"
                        type="range"
                        min="0"
                        :max="history.length - 1"
                        :value="snapshotIndex"
                        @input="selectSnapshot(Number($event.target.value))"
                    />

                    <div class="tm-update-counter">
                        Update {{ snapshotIndex + 1 }}
                        of {{ history.length }}
                    </div>

                    <button
                        class="tm-button tm-latest"
                        @click="selectSnapshot(history.length - 1)"
                    >
                        Latest Snapshot
                    </button>

                    <router-link
                        class="tm-button"
                        to="/"
                    >
                        Return to Current List
                    </router-link>

                </div>

                <div class="tm-date-banner">

                    <span class="tm-label">
                        Last Ranking Update
                    </span>

                    <strong>
                        {{ formatDate(snapshot?.date) }}
                    </strong>

                </div>

                <input
                    class="list-search tm-search"
                    v-model="search"
                    placeholder="Search historical levels..."
                />

                <p v-if="loadingLevels">
                    Loading levels...
                </p>

                <table v-else class="list">

                    <tr
                        v-for="level in filteredLevels"
                        :key="level.path"
                    >

                        <td class="rank">
                            #{{ level.trueRank }}
                        </td>

                        <td
                            class="level"
                            :class="{
                                active:
                                    selectedPath === level.path &&
                                    !selectedLegacy
                            }"
                        >

                            <button
                                @click="selectLevel(level.path, false)"
                            >

                                <img
                                    v-if="level.youtubeId"
                                    class="thumb"
                                    :src="'https://img.youtube.com/vi/' +
                                        level.youtubeId +
                                        '/mqdefault.jpg'"
                                />

                                <div class="tm-level-name">
                                    {{ level.name }}
                                </div>

                                <span
                                    class="tm-movement"
                                    :class="movementClass(level.path)"
                                >
                                    {{ movementText(level.path) }}
                                </span>

                            </button>

                        </td>

                    </tr>

                </table>

                <!-- LEGACY LEVELS -->

                <div
                    v-if="!loadingLevels && filteredLegacy.length"
                    class="legacy-list"
                >

                    <div class="legacy-title">
                        Legacy Levels
                    </div>

                    <div
                        v-for="level in filteredLegacy"
                        :key="level.path"
                        class="legacy-level"
                        :class="{
                            active:
                                selectedPath === level.path &&
                                selectedLegacy
                        }"
                        @click="selectLevel(level.path, true)"
                    >

                        <img
                            v-if="level.youtubeId"
                            class="thumb"
                            :src="'https://img.youtube.com/vi/' +
                                level.youtubeId +
                                '/mqdefault.jpg'"
                        />

                        <span>{{ level.name }}</span>

                    </div>

                </div>

            </aside>


            <!-- MIDDLE PANEL -->

            <section class="app-main">

                <div class="tm-historical-banner">
                    Viewing historical rankings
                </div>

                <p v-if="loadingLevels">
                    Loading snapshot...
                </p>

                <div v-else-if="level" class="level">

                    <h1>{{ level.name }}</h1>

                    <LevelAuthors
                        v-if="!level.unavailable"
                        :creators="level.creators || []"
                        :verifier="level.verifier"
                    />

                    <iframe
                        v-if="video"
                        class="video"
                        :src="video"
                        frameborder="0"
                        allowfullscreen
                    ></iframe>

                    <div
                        v-if="level.unavailable"
                        class="tm-notice"
                    >
                        This level's original data file is
                        no longer available.
                        Its historical ranking has been preserved.
                    </div>

                    <div class="tm-stats">

                        <div class="tm-stat">

                            <span class="tm-label">
                                Historical Rank
                            </span>

                            <strong>
                                {{ selectedLegacy
                                    ? "Legacy"
                                    : "#" + level.trueRank }}
                            </strong>

                        </div>

                        <div class="tm-stat">

                            <span class="tm-label">
                                Points
                            </span>

                            <strong>
                                {{ selectedLegacy || level.unavailable
                                    ? "—"
                                    : score(
                                        level.trueRank,
                                        100,
                                        level.percentToQualify
                                    ) }}
                            </strong>

                        </div>

                        <div class="tm-stat">

                            <span class="tm-label">
                                Rank Change
                            </span>

                            <strong
                                :class="movementClass(level.path)"
                            >
                                {{ selectedLegacy
                                    ? "—"
                                    : movementText(level.path) }}
                            </strong>

                        </div>

                    </div>

                    <div class="meta-row">

                        <p class="type-body">
                            ID: {{ level.id || "N/A" }}
                        </p>

                        <p class="type-body">
                            Rating: {{ level.rating || "N/A" }}
                        </p>

                        <p class="type-body">
                            Length:
                            {{ level.lengthDisplay ||
                                level.length ||
                                "N/A" }}
                        </p>

                    </div>


                    <!-- RANKING HISTORY GRAPH -->

                    <div
                        v-if="graphSegments.length"
                        class="tm-graph"
                    >

                        <h2>Ranking History</h2>

                        <div class="tm-graph-container">

                            <svg
                                viewBox="0 0 600 240"
                                class="tm-graph-svg"
                                role="img"
                                aria-label="Historical level ranking graph"
                            >

                                <!-- GRID LINES -->

                                <g
                                    v-for="rank in graphTicks"
                                    :key="rank"
                                >

                                    <line
                                        x1="45"
                                        x2="580"
                                        :y1="graphY(rank)"
                                        :y2="graphY(rank)"
                                        class="tm-grid-line"
                                    />

                                    <text
                                        x="35"
                                        :y="graphY(rank) + 4"
                                        text-anchor="end"
                                        class="tm-axis-label"
                                    >
                                        #{{ rank }}
                                    </text>

                                </g>

                                <!-- STEPPED GRAPH -->

                                <path
                                    v-for="(segment, index) in graphSegments"
                                    :key="index"
                                    :d="segment"
                                    class="tm-graph-line"
                                />

                                <!-- RANKING CHANGE POINTS -->

                                <circle
                                    v-for="point in graphPoints"
                                    :key="point.date"
                                    :cx="point.x"
                                    :cy="point.y"
                                    r="4"
                                    class="tm-graph-point"
                                >
                                    <title>
                                        {{ formatDate(point.date) }}:
                                        #{{ point.rank }}
                                    </title>
                                </circle>

                                <!-- DATE LABELS -->

                                <text
                                    x="45"
                                    y="230"
                                    class="tm-axis-label"
                                >
                                    {{ shortDate(firstPlacement?.date) }}
                                </text>

                                <text
                                    x="580"
                                    y="230"
                                    text-anchor="end"
                                    class="tm-axis-label"
                                >
                                    {{ shortDate(snapshot?.date) }}
                                </text>

                            </svg>

                        </div>

                        <div class="tm-stats">

                            <div class="tm-stat">
                                <span class="tm-label">
                                    First Recorded Rank
                                </span>
                                <strong>
                                    #{{ firstPlacement?.rank }}
                                </strong>
                            </div>

                            <div class="tm-stat">
                                <span class="tm-label">
                                    Peak Rank
                                </span>
                                <strong>{{ peakRank }}</strong>
                            </div>

                            <div class="tm-stat">
                                <span class="tm-label">
                                    Selected Rank
                                </span>
                                <strong>
                                    {{ selectedLegacy
                                        ? "Legacy"
                                        : "#" + level.trueRank }}
                                </strong>
                            </div>

                        </div>

                    </div>

                    <div class="tm-notice">
                        Rankings are historical.
                        Level details and videos use current
                        available data. Points use the current
                        scoring formula.
                    </div>

                    <router-link
                        v-if="existsOnLatestList"
                        class="tm-button"
                        :to="{
                            path: '/',
                            query: { level: level.path }
                        }"
                    >
                        View on Current List
                    </router-link>

                </div>

                <p v-else>
                    Select a level to view its details.
                </p>

            </section>


            <!-- RIGHT SIDEBAR -->

            <aside class="app-right">

                <h2>List Statistics</h2>

                <div class="tm-stat">

                    <span class="tm-label">
                        Ranked Levels
                    </span>

                    <strong>
                        {{ snapshot?.levels.length || 0 }}
                    </strong>

                </div>

                <div class="tm-stat">

                    <span class="tm-label">
                        Legacy Levels
                    </span>

                    <strong>
                        {{ snapshot?.legacy?.length || 0 }}
                    </strong>

                </div>

                <div class="tm-stat">

                    <span class="tm-label">
                        Added to Ranked List
                    </span>

                    <strong>
                        {{ previousSnapshot ? newPlacements : "—" }}
                    </strong>

                </div>

                <div class="tm-stat">

                    <span class="tm-label">
                        Removed From Ranked List
                    </span>

                    <strong>
                        {{ previousSnapshot ? removedLevels : "—" }}
                    </strong>

                </div>

                <div
                    v-if="level && !loadingLevels"
                    class="tm-level-history"
                >

                    <h2>Level History</h2>

                    <div class="tm-stat">

                        <span class="tm-label">
                            First Recorded Placement
                        </span>

                        <strong>
                            {{ firstPlacement?.rank
                                ? "#" + firstPlacement.rank
                                : "—" }}
                        </strong>

                        <small v-if="firstPlacement">
                            {{ formatDate(firstPlacement.date) }}
                        </small>

                    </div>

                    <div class="tm-stat">

                        <span class="tm-label">
                            Peak Rank
                        </span>

                        <strong>{{ peakRank }}</strong>

                    </div>

                    <div class="tm-history-events">

                        <div
                            v-for="event in reversedLevelHistory"
                            :key="event.date"
                            class="tm-history-event"
                        >

                            <span>
                                {{ formatDate(event.date) }}
                            </span>

                            <strong>
                                {{ event.rank !== null
                                    ? "#" + event.rank
                                    : event.status === "legacy"
                                        ? "Legacy"
                                        : "Unlisted" }}
                            </strong>

                        </div>

                    </div>

                </div>

            </aside>

        </main>
    `,


    computed: {

        snapshot() {
            return this.history[this.snapshotIndex] || null;
        },

        previousSnapshot() {
            return this.history[this.snapshotIndex - 1] || null;
        },

        minDate() {
            return this.history.length
                ? new Date(this.history[0].date)
                    .toISOString().slice(0, 10)
                : "";
        },

        maxDate() {
            return new Date().toISOString().slice(0, 10);
        },

        filteredLevels() {

            const query = this.search.toLowerCase();

            return this.levels.filter(level =>
                level.name.toLowerCase().includes(query)
            );

        },

        filteredLegacy() {

            const query = this.search.toLowerCase();

            return this.legacyLevels.filter(level =>
                level.name.toLowerCase().includes(query)
            );

        },

        level() {

            const source = this.selectedLegacy
                ? this.legacyLevels
                : this.levels;

            return source.find(level =>
                level.path === this.selectedPath
            ) || null;

        },

        video() {

            const url =
                this.level?.showcase ||
                this.level?.verification;

            return url ? embed(url) : "";

        },

        existsOnLatestList() {

            if (!this.level || this.level.unavailable) {
                return false;
            }

            const latest = this.history[this.history.length - 1];

            return Boolean(
                latest?.levels.includes(this.level.path) ||
                latest?.legacy?.includes(this.level.path)
            );

        },

        newPlacements() {

            if (!this.previousSnapshot) return 0;

            return (this.snapshot?.levels || []).filter(path =>
                !this.previousSnapshot.levels.includes(path)
            ).length;

        },

        removedLevels() {

            if (!this.previousSnapshot) return 0;

            return this.previousSnapshot.levels.filter(path =>
                !this.snapshot?.levels.includes(path)
            ).length;

        },

        levelHistory() {

            if (!this.selectedPath) return [];

            return getLevelHistory(
                this.history.slice(0, this.snapshotIndex + 1),
                this.selectedPath
            );

        },

        reversedLevelHistory() {
            return [...this.levelHistory].reverse();
        },

        firstPlacement() {

            return this.levelHistory.find(event =>
                event.rank !== null
            ) || null;

        },

        peakRank() {

            const ranks = this.levelHistory
                .map(event => event.rank)
                .filter(rank => rank !== null);

            return ranks.length
                ? "#" + Math.min(...ranks)
                : "—";

        },


        // =================================================
        // GRAPH COMPUTED PROPERTIES
        // =================================================

        graphMaxRank() {

            const ranks = this.levelHistory
                .map(event => event.rank)
                .filter(rank => rank !== null);

            return Math.max(5, ...ranks);

        },

        graphTicks() {

            const max = this.graphMaxRank;

            const step = Math.max(
                1,
                Math.ceil((max - 1) / 5)
            );

            const ticks = [];

            for (let rank = 1; rank <= max; rank += step) {
                ticks.push(rank);
            }

            return ticks;

        },

        graphStart() {

            return this.firstPlacement
                ? Date.parse(this.firstPlacement.date)
                : 0;

        },

        graphEnd() {

            return this.snapshot
                ? Date.parse(this.snapshot.date)
                : 0;

        },

        graphPoints() {

            return this.levelHistory
                .filter(event => event.rank !== null)
                .map(event => ({
                    date: event.date,
                    rank: event.rank,
                    x: this.graphX(event.date),
                    y: this.graphY(event.rank)
                }));

        },

        graphSegments() {

            if (!this.firstPlacement) return [];

            const segments = [];

            let path = "";
            let previousRank = null;

            for (const event of this.levelHistory) {

                const x = this.graphX(event.date);

                if (event.rank === null) {

                    if (path) {
                        path += " H " + x;
                        segments.push(path);
                    }

                    path = "";
                    previousRank = null;

                    continue;

                }

                const y = this.graphY(event.rank);

                if (previousRank === null) {

                    path = "M " + x + " " + y;

                } else {

                    path += " H " + x + " V " + y;

                }

                previousRank = event.rank;

            }

            if (path) {

                path += " H " + this.graphX(this.snapshot.date);

                segments.push(path);

            }

            return segments;

        }

    },


    async mounted() {

        try {

            this.history = await fetchPositionHistory();

            if (!this.history.length) {
                throw new Error("No historical snapshots found.");
            }

            await this.selectSnapshot(
                this.history.length - 1
            );

        } catch (error) {

            this.error = error.message;

        } finally {

            this.loading = false;

        }

    },


    methods: {

        score,

        formatDate(date) {

            if (!date) return "N/A";

            return new Date(date).toLocaleString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "UTC"
            }) + " UTC";

        },

        shortDate(date) {

            if (!date) return "";

            return new Date(date).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
                timeZone: "UTC"
            });

        },

        async changeDate() {

            if (!this.selectedDate) {

                this.selectedDate = new Date(this.snapshot.date)
                    .toISOString().slice(0, 10);

                return;

            }

            const date = this.selectedDate < this.minDate
                ? this.minDate
                : this.selectedDate > this.maxDate
                    ? this.maxDate
                    : this.selectedDate;

            const snapshot = getHistoricalSnapshot(
                this.history,
                date
            );

            if (!snapshot) return;

            await this.selectSnapshot(
                this.history.indexOf(snapshot),
                date
            );

        },

        async selectSnapshot(index, requestedDate = null) {

            if (index < 0 || index >= this.history.length) {
                return;
            }

            const requestId = ++this.requestId;

            this.snapshotIndex = index;
            this.loadingLevels = true;

            const snapshot = this.history[index];

            this.selectedDate =
                requestedDate ||
                new Date(snapshot.date).toISOString().slice(0, 10);

            const [levels, legacy] = await Promise.all([

                Promise.all(
                    snapshot.levels.map(async (path, rank) => ({
                        ...await fetchHistoricalLevel(path),
                        trueRank: rank + 1
                    }))
                ),

                Promise.all(
                    (snapshot.legacy || []).map(async path => ({
                        ...await fetchHistoricalLevel(path),
                        trueRank: null
                    }))
                )

            ]);

            if (requestId !== this.requestId) return;

            this.levels = levels;
            this.legacyLevels = legacy;

            const selectedStillExists = this.selectedLegacy
                ? legacy.some(level =>
                    level.path === this.selectedPath
                )
                : levels.some(level =>
                    level.path === this.selectedPath
                );

            if (!selectedStillExists) {

                if (levels.some(level =>
                    level.path === this.selectedPath
                )) {

                    this.selectedLegacy = false;

                } else if (legacy.some(level =>
                    level.path === this.selectedPath
                )) {

                    this.selectedLegacy = true;

                } else {

                    this.selectedPath =
                        levels[0]?.path ||
                        legacy[0]?.path ||
                        null;

                    this.selectedLegacy = !levels.length;

                }

            }

            this.loadingLevels = false;

        },

        selectLevel(path, legacy) {

            this.selectedPath = path;
            this.selectedLegacy = legacy;

        },

        movement(path) {

            if (!this.previousSnapshot) return null;

            const oldRank =
                this.previousSnapshot.levels.indexOf(path);

            const newRank =
                this.snapshot.levels.indexOf(path);

            if (newRank === -1) return null;

            if (oldRank === -1) return "new";

            return oldRank - newRank;

        },

        movementText(path) {

            const movement = this.movement(path);

            if (movement === "new") return "NEW";
            if (movement === null) return "—";
            if (movement > 0) return "↑ " + movement;
            if (movement < 0) return "↓ " + Math.abs(movement);

            return "—";

        },

        movementClass(path) {

            const movement = this.movement(path);

            if (movement === "new") return "tm-new";
            if (movement > 0) return "tm-up";
            if (movement < 0) return "tm-down";

            return "tm-unchanged";

        },


        // =================================================
        // GRAPH COORDINATES
        // =================================================

        graphX(date) {

            const duration = this.graphEnd - this.graphStart;

            if (duration <= 0) return 45;

            const progress =
                (Date.parse(date) - this.graphStart) / duration;

            return 45 + progress * 535;

        },

        graphY(rank) {

            return 20 +
                ((rank - 1) / (this.graphMaxRank - 1)) * 180;

        }

    }

};
