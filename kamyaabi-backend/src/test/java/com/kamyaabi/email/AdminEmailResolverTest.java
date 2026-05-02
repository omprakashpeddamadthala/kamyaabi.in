package com.kamyaabi.email;

import com.kamyaabi.entity.User;
import com.kamyaabi.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminEmailResolverTest {

    @Mock private UserRepository userRepository;

    @InjectMocks private AdminEmailResolver resolver;

    @Test
    void getAdminEmails_returnsEmailsFromActiveAdmins() {
        when(userRepository.findEmailsByRoleAndStatus(User.Role.ADMIN, User.Status.ACTIVE))
                .thenReturn(List.of("a@x.com", "b@x.com"));
        assertThat(resolver.getAdminEmails()).containsExactly("a@x.com", "b@x.com");
    }

    @Test
    void getAdminEmails_returnsEmpty_whenRepoReturnsNull() {
        when(userRepository.findEmailsByRoleAndStatus(User.Role.ADMIN, User.Status.ACTIVE))
                .thenReturn(null);
        assertThat(resolver.getAdminEmails()).isEmpty();
    }

    @Test
    void getAdminEmails_returnsEmpty_whenRepoThrows() {
        when(userRepository.findEmailsByRoleAndStatus(User.Role.ADMIN, User.Status.ACTIVE))
                .thenThrow(new RuntimeException("db down"));
        assertThat(resolver.getAdminEmails()).isEmpty();
    }
}
