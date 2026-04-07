package com.lightfit.service;

import com.lightfit.domain.User;
import com.lightfit.repository.UserRepository;
import com.lightfit.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final SmsService smsService;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    private static final DateTimeFormatter DTF = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public String sendCode(String phone) {
        return smsService.send(phone);
    }

    @Transactional
    public AuthResult verify(String phone, String code) {
        if (!smsService.verify(phone, code)) {
            throw new IllegalArgumentException("验证码错误或已过期");
        }

        boolean isNewUser = !userRepository.existsByPhone(phone);
        User user;

        if (isNewUser) {
            user = new User();
            user.setId(phone);
            user.setPhone(phone);
            String now = LocalDateTime.now().format(DTF);
            user.setCreatedAt(now);
            user.setUpdatedAt(now);
            userRepository.save(user);
        } else {
            user = userRepository.findByPhone(phone).orElseThrow();
        }

        String token = jwtUtil.generate(user.getId(), phone);
        return new AuthResult(token, isNewUser, user.getId());
    }

    public record AuthResult(String token, boolean isNewUser, String userId) {}
}
