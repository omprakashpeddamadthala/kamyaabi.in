package com.kamyaabi.util;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SlugifierTest {

    @Test
    void slugify_simpleText_shouldLowercaseAndHyphenate() {
        assertThat(Slugifier.slugify("Hello World")).isEqualTo("hello-world");
    }

    @Test
    void slugify_specialChars_shouldRemove() {
        assertThat(Slugifier.slugify("Best Almonds in India!")).isEqualTo("best-almonds-in-india");
    }

    @Test
    void slugify_diacritics_shouldNormalize() {
        assertThat(Slugifier.slugify("Crème Brûlée")).isEqualTo("creme-brulee");
    }

    @Test
    void slugify_multipleSpaces_shouldCollapseToSingleHyphen() {
        assertThat(Slugifier.slugify("  Hello   World  ")).isEqualTo("hello-world");
    }

    @Test
    void slugify_null_shouldReturnEmpty() {
        assertThat(Slugifier.slugify(null)).isEqualTo("");
    }

    @Test
    void slugify_empty_shouldReturnEmpty() {
        assertThat(Slugifier.slugify("")).isEqualTo("");
    }

    @Test
    void slugify_numbers_shouldPreserve() {
        assertThat(Slugifier.slugify("Top 10 Dry Fruits")).isEqualTo("top-10-dry-fruits");
    }

    @Test
    void slugify_mixedCase_shouldLowercase() {
        assertThat(Slugifier.slugify("PREMIUM Cashews")).isEqualTo("premium-cashews");
    }
}
