package com.kamyaabi.security;

import com.kamyaabi.entity.User;
import com.kamyaabi.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauth2User = super.loadUser(userRequest);
        
        Map<String, Object> attributes = oauth2User.getAttributes();
        String email = (String) attributes.get("email");
        String name = (String) attributes.get("name");
        String googleId = (String) attributes.get("sub");
        
        log.info("Processing OAuth2 user: {}", email);
        
        // Create or update user
        User user = userRepository.findByEmail(email)
                .orElse(User.builder()
                        .email(email)
                        .name(name)
                        .role(User.Role.USER)
                        .googleId(googleId)
                        .build());
        
        // Update user info if needed
        if (user.getGoogleId() == null) {
            user.setGoogleId(googleId);
        }
        if (!user.getName().equals(name)) {
            user.setName(name);
        }
        
        userRepository.save(user);
        
        return oauth2User;
    }
}
