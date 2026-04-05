package com.lightfit.service;

import com.lightfit.domain.User;
import com.lightfit.dto.UserDTO;
import com.lightfit.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private static final DateTimeFormatter DTF = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public UserDTO.ProfileResponse getProfile(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        return toResponse(user);
    }

    @Transactional
    public UserDTO.ProfileResponse saveProfile(String userId, UserDTO.ProfileRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));

        if (req.getGender() != null)        user.setGender(req.getGender());
        if (req.getHeight() != null)        user.setHeight(req.getHeight());
        if (req.getWeight() != null)        user.setWeight(req.getWeight());
        if (req.getAge() != null)           user.setAge(req.getAge());
        if (req.getActivityLevel() != null) user.setActivityLevel(req.getActivityLevel());
        if (req.getTargetDeficit() != null) user.setTargetDeficit(req.getTargetDeficit());

        // 重新计算 BMR（Mifflin-St Jeor）
        if (user.getHeight() != null && user.getWeight() != null
                && user.getAge() != null && user.getGender() != null) {
            user.setBmr(calcBmr(user));
        }

        user.setUpdatedAt(LocalDateTime.now().format(DTF));
        userRepository.save(user);
        return toResponse(user);
    }

    private double calcBmr(User u) {
        double base = 10 * u.getWeight() + 6.25 * u.getHeight() - 5 * u.getAge();
        return "male".equals(u.getGender()) ? base + 5 : base - 161;
    }

    private UserDTO.ProfileResponse toResponse(User u) {
        UserDTO.ProfileResponse resp = new UserDTO.ProfileResponse();
        resp.setId(u.getId());
        resp.setPhone(u.getPhone());
        resp.setGender(u.getGender());
        resp.setHeight(u.getHeight());
        resp.setWeight(u.getWeight());
        resp.setAge(u.getAge());
        resp.setActivityLevel(u.getActivityLevel());
        resp.setTargetDeficit(u.getTargetDeficit());
        resp.setBmr(u.getBmr());
        resp.setProfileComplete(u.getHeight() != null && u.getWeight() != null
                && u.getAge() != null && u.getGender() != null);
        return resp;
    }
}
