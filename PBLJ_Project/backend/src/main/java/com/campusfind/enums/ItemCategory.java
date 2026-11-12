package com.campusfind.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum ItemCategory {
    ELECTRONICS("Electronics"),
    DOCUMENTS_ID("Documents and ID Cards"),
    BAGS("Bags"),
    WALLETS_MONEY("Wallets and Money"),
    BOOKS_STATIONERY("Books and Stationery"),
    KEYS("Keys"),
    CLOTHING("Clothing"),
    ACCESSORIES("Accessories"),
    OTHER("Other");

    private final String displayName;

    ItemCategory(String displayName) {
        this.displayName = displayName;
    }

    @JsonValue
    public String getDisplayName() {
        return displayName;
    }

    @JsonCreator
    public static ItemCategory fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            return OTHER;
        }
        for (ItemCategory cat : ItemCategory.values()) {
            if (cat.name().equalsIgnoreCase(value) || cat.displayName.equalsIgnoreCase(value.trim())) {
                return cat;
            }
        }
        return OTHER;
    }
}
