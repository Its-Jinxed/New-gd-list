
export default {
    props: {
        author: {
            type: String,
            required: false,
        },
        creators: {
            type: Array,
            required: true,
        },
        verifier: {
            type: String,
            required: true,
        },
    },

    template: `
        <div class="level-authors">

            <!-- CREATOR COLUMN -->
            <div class="author-col">
                <div class="type-title-sm">
                    {{ creators.length === 0 ? 'Creator' : 'Creator(s)' }}
                </div>

                <p class="type-body">
                    <template v-if="creators.length">
                        <template
                            v-for="(creator, index) in creators"
                            :key="creator"
                        >
                            <router-link
                                :to="{
                                    path: '/leaderboard',
                                    query: {
                                        player: creator,
                                        mode: 'creator'
                                    }
                                }"
                                class="author-link"
                            >
                                {{ creator }}
                            </router-link>

                            <span v-if="index < creators.length - 1">, </span>
                        </template>
                    </template>

                    <template v-else>
                        <router-link
                            v-if="author"
                            :to="{
                                path: '/leaderboard',
                                query: {
                                    player: author,
                                    mode: 'creator'
                                }
                            }"
                            class="author-link"
                        >
                            {{ author }}
                        </router-link>
                    </template>
                </p>
            </div>

            <!-- VERIFIER COLUMN -->
            <div class="author-col">
                <div class="type-title-sm">
                    {{ selfVerified ? 'Creator & Verifier' : 'Verifier' }}
                </div>

                <p class="type-body">
                    <router-link
                        :to="{
                            path: '/leaderboard',
                            query: {
                                player: verifier,
                                mode: 'total'
                            }
                        }"
                        class="author-link"
                    >
                        {{ verifier }}
                    </router-link>
                </p>
            </div>

        </div>
    `,

    computed: {
        selfVerified() {
            return this.author === this.verifier && this.creators.length === 0;
        },
    },
};
