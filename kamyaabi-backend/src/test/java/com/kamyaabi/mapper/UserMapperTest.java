package com.kamyaabi.mapper;

import com.kamyaabi.dto.response.UserResponse;
import com.kamyaabi.entity.User;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class UserMapperTest {

    private final UserMapper userMapper = new UserMapper();

    @Test
    void toResponse_shouldMapAllFields() {
        User user = User.builder()
                .id(1L).email("test@kamyaabi.in").name("Test User")
                .avatarUrl("http://avatar.url").role(User.Role.USER)
                .build();

        UserResponse response = userMapper.toResponse(user);

        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.email()).isEqualTo("test@kamyaabi.in");
        assertThat(response.name()).isEqualTo("Test User");
        assertThat(response.avatarUrl()).isEqualTo("http://avatar.url");
        assertThat(response.role()).isEqualTo("USER");
    }

    @Test
    void toResponse_adminUser_shouldReturnAdminRole() {
        User user = User.builder()
                .id(1L).email("admin@kamyaabi.in").name("Admin")
                .role(User.Role.ADMIN)
                .build();

        UserResponse response = userMapper.toResponse(user);

        assertThat(response.role()).isEqualTo("ADMIN");
    }
}
