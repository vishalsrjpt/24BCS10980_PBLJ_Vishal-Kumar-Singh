package com.campusfind.dto.response;

import com.campusfind.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String fullName;
    private String email;
    private Role role;
    private String phoneNumber;
    private String studentId;
    private String department;
    private boolean active;
    private OffsetDateTime createdAt;
}
