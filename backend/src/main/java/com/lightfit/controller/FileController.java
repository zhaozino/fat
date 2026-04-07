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
     * GET /api/file/upload-url?ext=jpg
     * 返回预签名上传 URL，前端直接 PUT 上传
     */
    @GetMapping("/upload-url")
    public ResponseEntity<FileDTO.PresignedUrlResponse> getUploadUrl(
            Authentication auth,
            @RequestParam(required = false) String ext) {
        return ResponseEntity.ok(fileService.generatePresignedUrl(auth.getName(), ext));
    }

    /**
     * GET /api/file/upload-token
     * 返回 COS STS 临时凭证，前端直传图片使用
     */
    @GetMapping("/upload-token")
    public ResponseEntity<FileDTO.UploadTokenResponse> getUploadToken(Authentication auth) {
        return ResponseEntity.ok(fileService.generateUploadToken(auth.getName()));
    }
}
