package com.connectgrs.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class MailService {
    private static final Logger log = LoggerFactory.getLogger(MailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromAddress;

    public MailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendVerificationCode(String toEmail, String code) {
        SimpleMailMessage message = new SimpleMailMessage();
        if (!fromAddress.isBlank()) {
            message.setFrom(fromAddress);
        }
        message.setTo(toEmail);
        message.setSubject("[Connect] 이메일 인증번호");
        message.setText("인증번호는 " + code + " 입니다. 5분 이내에 입력해주세요.");
        try {
            mailSender.send(message);
        } catch (MailException e) {
            log.error("Failed to send verification email to {}: {}", toEmail, e.getMessage());
            throw e;
        }
    }
}
