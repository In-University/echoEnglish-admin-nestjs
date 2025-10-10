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
import { Response } from '../../common/interfaces/response.interface';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) { }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<Response<any>> {
    const result = await this.authService.login(loginDto);
    return {
      message: 'Login successfully',
      data: result,
    };
  }

  @Public()
  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string): Promise<Response<any>> {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new BadRequestException('User not found');

    const result = await this.authService.generateOtp(email, OtpPurpose.FORGOT_PASSWORD);
    return {
      message: "",
      data: result
    };
  }

  @Public()
  @Post('verify-otp')
  async verifyOtp(@Body() body: { email: string; otp: string }): Promise<Response<any>> {
    await this.authService.verifyOtp(body.email, body.otp);
    return {
      message: 'OTP verified'
    };
  }

  @Public()
  @Post('reset-password')
  async resetPassword(
    @Body() body: { email: string; otp: string; newPassword: string },
  ): Promise<Response<any>> {
    const { email, otp, newPassword } = body;
    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }
    await this.authService.verifyOtp(email, otp);
    await this.usersService.updatePassword(email, newPassword);

    return { message: 'Password reset successful' };
  }
}
