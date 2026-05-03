package com.kamyaabi.util;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

public final class Slugifier {

    private static final Pattern NON_ALPHANUM = Pattern.compile("[^a-z0-9]+");
    private static final Pattern EDGES = Pattern.compile("(^-|-$)");
    private static final Pattern DIACRITICS = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");

    private Slugifier() {
    }

    public static String slugify(String value) {
        if (value == null) {
            return "";
        }
        String normalized = DIACRITICS.matcher(Normalizer.normalize(value, Normalizer.Form.NFD))
                .replaceAll("")
                .toLowerCase(Locale.ROOT);
        String dashed = NON_ALPHANUM.matcher(normalized).replaceAll("-");
        return EDGES.matcher(dashed).replaceAll("");
    }
}
