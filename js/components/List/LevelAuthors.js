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
                            :key="\`creator-\${creator}\`"
                        >
                            <span>{{ creator }}</span>
                            <span v-if="index < creators.length - 1">, </span>
                        </template>
                    </template>

                    <template v-else>
                        <span>{{ author }}</span>
                    </template>
                </p>
            </div>

            <!-- VERIFIER COLUMN -->
            <div class="author-col">
                <div class="type-title-sm">
                    {{ selfVerified ? 'Creator & Verifier' : 'Verifier' }}
                </div>

                <p class="type-body">
                    <span>{{ verifier }}</span>
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
