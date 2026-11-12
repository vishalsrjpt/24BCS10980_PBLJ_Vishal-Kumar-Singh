package com.campusfind;

import com.campusfind.dto.request.AdminCreateRequest;
import com.campusfind.dto.request.LoginRequest;
import com.campusfind.dto.request.RegisterRequest;
import com.campusfind.entity.User;
import com.campusfind.enums.Role;
import com.campusfind.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthAndWorkflowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("Super Admin account is initialized automatically")
    void testSuperAdminInitialization() {
        assertTrue(userRepository.findByEmail("admin@gmail.com").isPresent());
        User superAdmin = userRepository.findByEmail("admin@gmail.com").get();
        assertEquals(Role.SUPERADMIN, superAdmin.getRole());
        assertTrue(superAdmin.isActive());
    }

    @Test
    @DisplayName("Student registration with @cuchd.in email derives University ID and allows login")
    void testStudentRegistrationAndLogin() throws Exception {
        String uid = "24BCS" + (System.currentTimeMillis() % 100000);
        String email = uid + "@cuchd.in";
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setFullName("John Doe");
        registerRequest.setEmail(email);
        registerRequest.setPassword("password123");
        registerRequest.setPhoneNumber("9876543210");
        registerRequest.setDepartment("Computer Science & Engineering");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.user.role").value("STUDENT"))
                .andExpect(jsonPath("$.data.user.studentId").value(uid));

        // Login with newly registered student
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail(email);
        loginRequest.setPassword("password123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isNotEmpty());
    }

    @Test
    @DisplayName("Student registration rejects non-@cuchd.in email or missing required fields")
    void testStudentRegistrationRejectsNonCuchdEmail() throws Exception {
        RegisterRequest invalidRequest = new RegisterRequest();
        invalidRequest.setFullName("Invalid User");
        invalidRequest.setEmail("student@gmail.com");
        invalidRequest.setPassword("password123");
        invalidRequest.setPhoneNumber("9876543210");
        invalidRequest.setDepartment("CSE");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "admin@gmail.com", roles = {"SUPERADMIN"})
    @DisplayName("Super Admin can create a new Admin")
    void testSuperAdminCanCreateAdmin() throws Exception {
        String adminEmail = "subadmin." + System.currentTimeMillis() + "@campus.edu";
        AdminCreateRequest createRequest = new AdminCreateRequest();
        createRequest.setFullName("Sub Admin Officer");
        createRequest.setEmail(adminEmail);
        createRequest.setPassword("adminpass123");
        createRequest.setDepartment("Facilities");

        mockMvc.perform(post("/api/superadmin/admins")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.role").value("ADMIN"));
    }

    @Test
    @WithMockUser(username = "regular.admin@campus.edu", roles = {"ADMIN"})
    @DisplayName("Regular Admin is FORBIDDEN from creating another Admin")
    void testRegularAdminCannotCreateAdmin() throws Exception {
        AdminCreateRequest createRequest = new AdminCreateRequest();
        createRequest.setFullName("Unauthorized Admin");
        createRequest.setEmail("unauth@campus.edu");
        createRequest.setPassword("adminpass123");

        mockMvc.perform(post("/api/superadmin/admins")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isForbidden());
    }
}
