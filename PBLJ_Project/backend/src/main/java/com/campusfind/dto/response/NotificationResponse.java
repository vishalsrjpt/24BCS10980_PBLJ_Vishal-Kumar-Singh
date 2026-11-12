package com.campusfind.dto.response;

import com.campusfind.enums.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {
    private Long id;
    private String title;
    private String message;
    private NotificationType type;
    private String relatedEntityType;
    private Long relatedEntityId;
    private boolean read;
    private OffsetDateTime createdAt;
}
