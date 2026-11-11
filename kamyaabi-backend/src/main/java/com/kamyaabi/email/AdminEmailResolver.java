package com.kamyaabi.email;

import com.kamyaabi.entity.User;
import com.kamyaabi.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Slf4j
@Component
public class AdminEmailResolver {

    private final UserRepository userRepository;

    public AdminEmailResolver(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<String> getAdminEmails() {
        try {
            List<String> emails = userRepository.findEmailsByRoleAndStatus(
                    User.Role.ADMIN, User.Status.ACTIVE);
            return emails == null ? Collections.emptyList() : emails;
        } catch (Exception e) {
            log.error("Failed to fetch admin emails from users table — "
                    + "admin notifications will be skipped for this event.", e);
            return Collections.emptyList();
        }
    }
}
