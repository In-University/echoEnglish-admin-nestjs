import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from '../../common/decorators/public.decorator';
import { UsersService } from '../users/users.service';
import { OtpPurpose } from '../../common/enums/otp-purpose.enum';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new BadRequestException('User not found');

    return this.authService.generateOtp(email, OtpPurpose.FORGOT_PASSWORD);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() body: { email: string; otp: string }) {
    await this.authService.verifyOtp(body.email, body.otp);
    return { message: 'OTP verified' };
  }

  @Post('reset-password')
  async resetPassword(
    @Body() body: { email: string; otp: string; newPassword: string },
  ) {
    await this.authService.verifyOtp(body.email, body.otp);
    await this.usersService.updatePassword(body.email, body.newPassword);

    return { message: 'Password reset successful' };
  }
}
