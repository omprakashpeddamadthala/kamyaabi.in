package com.kamyaabi.service;

import com.kamyaabi.dto.response.AuthResponse;
import com.kamyaabi.dto.response.UserResponse;
import com.kamyaabi.entity.User;

import java.util.Map;

public interface AuthService {

    AuthResponse googleLogin(String idToken);

    AuthResponse googleLoginFromRequest(Map<String, Object> request);

    AuthResponse processGoogleUser(Map<String, Object> userInfo);

    UserResponse getCurrentUser(Long userId);

    User getUserByEmail(String email);
}
