package com.kamyaabi.service;

import com.kamyaabi.dto.request.ProfileRequest;
import com.kamyaabi.dto.response.ProfileResponse;

public interface ProfileService {
    ProfileResponse getProfile(Long userId);
    ProfileResponse updateProfile(Long userId, ProfileRequest request);
}
