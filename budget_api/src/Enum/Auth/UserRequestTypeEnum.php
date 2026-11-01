<?php

namespace App\Enum\Auth;

enum UserRequestTypeEnum: string
{
    case OtpRegister = 'otp_register';
    case OtpLogin = 'otp_login';
    case EmailVerification = 'email_verification';
    case PasswordReset = 'password_reset';
    case EmailChange = 'email_change';
    case AccountDeletion = 'account_deletion';
}
