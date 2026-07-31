import { login } from "../auth.js";

export default {
    data() {
        return {
            email: "",
            password: "",
            error: ""
        };
    },

    methods: {
        async signIn() {
            this.error = "";

            try {
                await login(this.email, this.password);
                alert("Logged in!");
            } catch (err) {
                this.error = err.message;
            }
        }
    },

    template: `
        <main class="page">
            <h1>Login</h1>

            <input
                v-model="email"
                type="email"
                placeholder="Email"
            />

            <br><br>

            <input
                v-model="password"
                type="password"
                placeholder="Password"
            />

            <br><br>

            <button @click="signIn">
                Login
            </button>

            <p v-if="error" style="color:red;">
                {{ error }}
            </p>
        </main>
    `
};
