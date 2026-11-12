package com.campusfind.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemImageResponse {
    private Long id;
    private String fileName;
    private String url;
    private String contentType;
    private Long fileSize;
    private OffsetDateTime uploadedAt;
}
