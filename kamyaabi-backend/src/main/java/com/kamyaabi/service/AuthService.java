package com.kamyaabi.service;

import com.kamyaabi.dto.response.AuthResponse;
import com.kamyaabi.dto.response.UserResponse;

public interface AuthService {
    AuthResponse googleLogin(String idToken);
    UserResponse getCurrentUser(Long userId);
}
