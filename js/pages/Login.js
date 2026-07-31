import { login, register } from "../auth.js";

export default {
    data() {
        return {
            email: "",
            password: "",
            confirmPassword: "",
            error: "",
            signup: false
        };
    },

    methods: {
        async submit() {
            this.error = "";

            try {
                if (this.signup) {

                    if (this.password !== this.confirmPassword) {
                        this.error = "Passwords do not match.";
                        return;
                    }

                    await register(this.email, this.password);

                    alert("Account created!");

                } else {

                    await login(this.email, this.password);

                    alert("Logged in!");

                }

                // Redirect to the home page
                this.$router.push("/");

            } catch (err) {
                this.error = err.message;
            }
        }
    },

    template: `
        <main class="page">

            <h1>{{ signup ? "Create Account" : "Login" }}</h1>

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

            <input
                v-if="signup"
                v-model="confirmPassword"
                type="password"
                placeholder="Confirm Password"
            />

            <br v-if="signup"><br v-if="signup">

            <button @click="submit">
                {{ signup ? "Create Account" : "Login" }}
            </button>

            <br><br>

            <a
                href="#"
                @click.prevent="signup = !signup"
            >
                {{ signup
                    ? "Already have an account? Login"
                    : "Don't have an account? Create one"
                }}
            </a>

            <p
                v-if="error"
                style="color:red; margin-top:20px;"
            >
                {{ error }}
            </p>

        </main>
    `
};
