package com.example.studentmanagement;

import com.example.studentmanagement.entity.Student;
import com.example.studentmanagement.repository.StudentRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class StudentControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        studentRepository.deleteAll();
    }

    @Test
    void shouldCreateAndRetrieveStudent() throws Exception {
        Student student = new Student(null, "Aarav Sharma", "aarav.sharma@example.com", "Computer Science", 21);

        mockMvc.perform(post("/api/students")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(student)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name", is("Aarav Sharma")))
                .andExpect(jsonPath("$.email", is("aarav.sharma@example.com")))
                .andExpect(jsonPath("$.course", is("Computer Science")))
                .andExpect(jsonPath("$.age", is(21)));

        mockMvc.perform(get("/api/students"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void shouldGetStudentByIdAndUpdateAndDelete() throws Exception {
        Student saved = studentRepository.save(
                new Student(null, "Priya Verma", "priya.verma@example.com", "Data Science", 22));

        mockMvc.perform(get("/api/students/{id}", saved.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Priya Verma")))
                .andExpect(jsonPath("$.course", is("Data Science")));

        Student updated = new Student(null, "Priya Verma", "priya.updated@example.com", "AI & ML", 23);

        mockMvc.perform(put("/api/students/{id}", saved.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updated)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email", is("priya.updated@example.com")))
                .andExpect(jsonPath("$.course", is("AI & ML")))
                .andExpect(jsonPath("$.age", is(23)));

        mockMvc.perform(delete("/api/students/{id}", saved.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", is("Student deleted successfully")));

        mockMvc.perform(get("/api/students/{id}", saved.getId()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)));
    }

    @Test
    void shouldRetrieveStudentsByCourseIgnoreCase() throws Exception {
        studentRepository.save(new Student(null, "Rohan Mehta", "rohan@example.com", "Spring Boot", 20));
        studentRepository.save(new Student(null, "Neha Gupta", "neha@example.com", "Spring Boot", 21));
        studentRepository.save(new Student(null, "Karan Patel", "karan@example.com", "Cloud Computing", 22));

        mockMvc.perform(get("/api/students/course/{course}", "spring boot"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    void shouldReturnConflictOnDuplicateEmail() throws Exception {
        studentRepository.save(new Student(null, "Ananya Roy", "ananya@example.com", "Java", 20));
        Student duplicate = new Student(null, "Another Roy", "ananya@example.com", "Python", 22);

        mockMvc.perform(post("/api/students")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicate)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status", is(409)));
    }

    @Test
    void shouldReturnBadRequestOnInvalidInput() throws Exception {
        Student invalid = new Student(null, "", "not-an-email", "", -5);

        mockMvc.perform(post("/api/students")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.validationErrors.name").exists())
                .andExpect(jsonPath("$.validationErrors.email").exists())
                .andExpect(jsonPath("$.validationErrors.course").exists())
                .andExpect(jsonPath("$.validationErrors.age").exists());
    }
}
