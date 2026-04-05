package com.lightfit.controller;

import com.lightfit.dto.UserDTO;
import com.lightfit.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<UserDTO.ProfileResponse> getProfile(Authentication auth) {
        return ResponseEntity.ok(userService.getProfile(auth.getName()));
    }

    @PostMapping("/profile")
    public ResponseEntity<UserDTO.ProfileResponse> saveProfile(
            Authentication auth,
            @RequestBody UserDTO.ProfileRequest req) {
        return ResponseEntity.ok(userService.saveProfile(auth.getName(), req));
    }
}
