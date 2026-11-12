package com.campusfind.config;

import com.campusfind.entity.User;
import com.campusfind.enums.Role;
import com.campusfind.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${campusfind.superadmin.email:admin@gmail.com}")
    private String superAdminEmail;

    @Value("${campusfind.superadmin.password:admin123}")
    private String superAdminPassword;

    @Value("${campusfind.superadmin.name:System Super Admin}")
    private String superAdminName;

    @Override
    @Transactional
    public void run(String... args) {
        initializeSuperAdmin();
    }

    private void initializeSuperAdmin() {
        String cleanEmail = superAdminEmail.toLowerCase().trim();
        if (userRepository.findByEmail(cleanEmail).isEmpty()) {
            User superAdmin = User.builder()
                    .fullName(superAdminName)
                    .email(cleanEmail)
                    .password(passwordEncoder.encode(superAdminPassword))
                    .role(Role.SUPERADMIN)
                    .phoneNumber("+1-555-0100")
                    .department("Campus Security Administration")
                    .active(true)
                    .build();

            userRepository.save(superAdmin);
            log.info("Default Super Admin initialized idempotently with email: {}", cleanEmail);
        } else {
            log.info("Super Admin account exists: {}", cleanEmail);
        }
    }
}
