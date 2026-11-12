package com.campusfind.dto.request;

import com.campusfind.enums.ItemCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
public class ItemReportUpdateRequest {

    @NotBlank(message = "Title is required")
    @Size(min = 3, max = 150, message = "Title must be between 3 and 150 characters")
    private String title;

    @NotBlank(message = "Description is required")
    @Size(min = 10, max = 3000, message = "Description must be between 10 and 3000 characters")
    private String description;

    @NotNull(message = "Category is required")
    private ItemCategory category;

    private String color;
    private String brand;

    @NotBlank(message = "Location is required")
    private String location;

    @NotNull(message = "Date is required")
    private OffsetDateTime eventDate;

    private String identifyingDetails;
    private String additionalNotes;
}
