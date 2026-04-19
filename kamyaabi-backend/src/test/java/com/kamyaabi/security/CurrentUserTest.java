package com.kamyaabi.security;

import com.kamyaabi.entity.User;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.assertj.core.api.Assertions.assertThat;

class CurrentUserTest {

    private final CurrentUser currentUser = new CurrentUser();

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getUser_withAuthenticatedUser_shouldReturnUser() {
        User user = User.builder().id(1L).email("test@kamyaabi.shop").name("Test").role(User.Role.USER).build();
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(user, null);
        SecurityContextHolder.getContext().setAuthentication(auth);

        User result = currentUser.getUser();

        assertThat(result).isEqualTo(user);
    }

    @Test
    void getUser_noAuthentication_shouldReturnNull() {
        User result = currentUser.getUser();

        assertThat(result).isNull();
    }

    @Test
    void getUser_nonUserPrincipal_shouldReturnNull() {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken("string-principal", null);
        SecurityContextHolder.getContext().setAuthentication(auth);

        User result = currentUser.getUser();

        assertThat(result).isNull();
    }

    @Test
    void getUserId_withAuthenticatedUser_shouldReturnId() {
        User user = User.builder().id(42L).email("test@kamyaabi.shop").name("Test").role(User.Role.USER).build();
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(user, null);
        SecurityContextHolder.getContext().setAuthentication(auth);

        Long userId = currentUser.getUserId();

        assertThat(userId).isEqualTo(42L);
    }

    @Test
    void getUserId_noAuthentication_shouldReturnNull() {
        Long userId = currentUser.getUserId();

        assertThat(userId).isNull();
    }
}
