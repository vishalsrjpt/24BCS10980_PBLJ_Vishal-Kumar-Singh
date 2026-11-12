# Student Management System REST API

A complete **Student Management REST API** built with **Spring Boot 3**, **Spring Data JPA**, **Bean Validation**, and **MySQL**.

---

## Tech Stack

- **Java 21**
- **Spring Boot 3.3.4** (`spring-boot-starter-web`, `spring-boot-starter-data-jpa`, `spring-boot-starter-validation`)
- **MySQL 8.0** (configured via Docker Compose or external MySQL)
- **Maven**
- **JUnit 5 & MockMvc** (with H2 for isolated integration tests)

---

## Project Structure

```text
.
├── db/
│   └── init.sql                                  # MySQL schema initialization script
├── postman/
│   └── Student_Management_System.postman_collection.json
├── src/
│   ├── main/
│   │   ├── java/com/example/studentmanagement/
│   │   │   ├── StudentManagementApplication.java
│   │   │   ├── controller/StudentController.java
│   │   │   ├── entity/Student.java
│   │   │   ├── exception/
│   │   │   │   ├── DuplicateEmailException.java
│   │   │   │   ├── ErrorResponse.java
│   │   │   │   ├── GlobalExceptionHandler.java
│   │   │   │   └── StudentNotFoundException.java
│   │   │   ├── repository/StudentRepository.java
│   │   │   └── service/
│   │   │       ├── StudentService.java
│   │   │       └── impl/StudentServiceImpl.java
│   │   └── resources/application.properties
│   └── test/
│       ├── java/com/example/studentmanagement/
│       │   └── StudentControllerIntegrationTest.java
│       └── resources/application.properties
├── docker-compose.yml
└── pom.xml
```

---

## Entity: `Student`

| Attribute | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `Long` | Primary Key, Auto-Increment | Unique student ID |
| `name` | `String` | `@NotBlank`, 2–100 chars | Student full name |
| `email` | `String` | `@NotBlank`, `@Email`, Unique | Student email address |
| `course` | `String` | `@NotBlank`, 2–100 chars | Enrolled course |
| `age` | `Integer` | `@NotNull`, 1–150 | Student age |

---

## Database Setup & Configuration

### Option 1: Docker MySQL (Included)

Start MySQL 8.0 using Docker Compose:

```bash
docker compose up -d
```

Default credentials configured in `docker-compose.yml` and `src/main/resources/application.properties`:
- **Database:** `student_management`
- **Host / Port:** `localhost:3306`
- **Username:** `student_user`
- **Password:** `student_pass`
- **Root Password:** `rootpassword`

### Option 2: External / Local MySQL

Override credentials via environment variables or edit `src/main/resources/application.properties`:

```bash
export DB_USERNAME=your_mysql_user
export DB_PASSWORD=your_mysql_password
```

---

## Running the Application

1. **Run automated tests:**
   ```bash
   mvn test
   ```

2. **Start the Spring Boot server:**
   ```bash
   mvn spring-boot:run
   ```
   > If port `8080` is already in use on your machine, start on another port (e.g., `8081`):
   > ```bash
   > SERVER_PORT=8081 mvn spring-boot:run
   > ```

---

## REST API Endpoints

| HTTP Method | Endpoint | Description | Success Status |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/students` | Add a new student | `201 Created` |
| `GET` | `/api/students` | Retrieve all students | `200 OK` |
| `GET` | `/api/students/{id}` | Retrieve student by ID | `200 OK` |
| `PUT` | `/api/students/{id}` | Update student details | `200 OK` |
| `DELETE` | `/api/students/{id}` | Delete a student | `200 OK` |
| `GET` | `/api/students/course/{course}` | Retrieve students by course (case-insensitive) | `200 OK` |

### Exception Handling & Error Status Codes

Handled globally via `GlobalExceptionHandler` (`@RestControllerAdvice`):
- **`404 Not Found`** — `StudentNotFoundException` when a student ID does not exist
- **`409 Conflict`** — `DuplicateEmailException` when creating/updating with an existing email
- **`400 Bad Request`** — Bean validation failures (`MethodArgumentNotValidException`), invalid path parameter types, or malformed JSON

---

## Testing with Postman (for Assignment Screenshots)

1. Open **Postman** and click **Import**.
2. Select `postman/Student_Management_System.postman_collection.json`.
3. Update the collection variable `baseUrl` if you changed the server port (default: `http://localhost:8080`).
4. Execute each request in order (`1` through `8`) and take screenshots of the request & response panels for your submission.
