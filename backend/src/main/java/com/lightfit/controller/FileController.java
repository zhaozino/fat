package com.lightfit.controller;

import com.lightfit.dto.FileDTO;
import com.lightfit.service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/file")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    /**
     * GET /api/file/upload-token
     * 返回 COS STS 临时凭证，前端直传图片使用
     */
    @GetMapping("/upload-token")
    public ResponseEntity<FileDTO.UploadTokenResponse> getUploadToken(Authentication auth) {
        return ResponseEntity.ok(fileService.generateUploadToken(auth.getName()));
    }
}
