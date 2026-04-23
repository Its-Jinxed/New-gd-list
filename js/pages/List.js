computed: {
    level() {
        // ALWAYS use original list index
        return this.list[this.selected]?.[0];
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
        let arr = this.list
            .map((item, originalIndex) => ({
                item,
                originalIndex
            }));

        // SEARCH
        if (this.search) {
            arr = arr.filter(({ item }) =>
                item[0]?.name?.toLowerCase().includes(this.search.toLowerCase())
            );
        }

        // CREATOR FILTER
        if (this.selectedCreators.length) {
            arr = arr.filter(({ item }) =>
                item[0]?.creators?.some(c =>
                    this.selectedCreators.includes(c)
                )
            );
        }

        // RATING FILTER
        if (this.selectedRatings.length) {
            arr = arr.filter(({ item }) =>
                this.selectedRatings.includes(item[0]?.rating)
            );
        }

        // SORT
        if (this.sortMode === "length") {
            arr.sort((a, b) =>
                (b.item[0]?.length || 0) - (a.item[0]?.length || 0)
            );
        }

        return arr;
    }
},
