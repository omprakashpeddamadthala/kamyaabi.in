package com.kamyaabi.service;

import com.kamyaabi.dto.response.AuthResponse;
import com.kamyaabi.dto.response.UserResponse;
import com.kamyaabi.entity.User;

import java.util.Map;

/**
 * Authentication service — issues JWTs for verified Google OAuth2 users and
 * exposes the current-user lookup used by the {@code /api/auth/me} endpoint.
 */
public interface AuthService {

    /**
     * Verifies a Google ID token, upserts the corresponding local user, and
     * returns a JWT + user profile. This is the supported modern flow.
     *
     * @param idToken Google ID token (JWT) from the client-side OAuth flow.
     * @return auth response containing the backend-issued JWT and user details.
     */
    AuthResponse googleLogin(String idToken);

    /**
     * Dispatches a Google login request coming from a client-supplied payload,
     * preferring ID-token verification and falling back to the legacy
     * user-info shape for backward compatibility. Controllers should call this
     * instead of branching on payload keys themselves.
     *
     * @param request raw Google login request payload.
     * @return auth response containing the backend-issued JWT and user details.
     */
    AuthResponse googleLoginFromRequest(Map<String, Object> request);

    /**
     * Legacy flow: process a user-info map (not an ID token) from Google.
     * Retained only for backward compatibility with older clients.
     */
    AuthResponse processGoogleUser(Map<String, Object> userInfo);

    /** @return user-facing profile for the authenticated user id. */
    UserResponse getCurrentUser(Long userId);

    /** @return persisted {@link User} by email, or throws if missing. */
    User getUserByEmail(String email);
}
