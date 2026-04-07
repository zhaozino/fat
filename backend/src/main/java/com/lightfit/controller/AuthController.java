package com.lightfit.controller;

import com.lightfit.dto.AuthDTO;
import com.lightfit.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/send-sms")
    public ResponseEntity<Map<String, Object>> sendSms(
            @Valid @RequestBody AuthDTO.SendSmsRequest req) {
        String mockCode = authService.sendCode(req.getPhone());
        var resp = new java.util.HashMap<String, Object>();
        resp.put("success", true);
        resp.put("message", "验证码已发送");
        if (mockCode != null) {
            resp.put("code", mockCode);
        }
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/verify")
    public ResponseEntity<AuthDTO.AuthResponse> verify(
            @Valid @RequestBody AuthDTO.VerifyRequest req) {
        AuthService.AuthResult result = authService.verify(req.getPhone(), req.getCode());
        return ResponseEntity.ok(new AuthDTO.AuthResponse(
                result.token(), result.isNewUser(), result.userId()));
    }
}
