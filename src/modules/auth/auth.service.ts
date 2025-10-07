import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { Otp, OtpDocument } from '../../database/otp.schema';
import { OtpPurpose } from '../../common/enums/otp-purpose.enum';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';

const OTP_EXPIRY_MINUTES = 5;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectModel(Otp.name) private readonly otpModel: Model<OtpDocument>,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isAdmin = user.roles.some(
      (role: any) => role.name === 'ADMIN',
    );

    if (!isAdmin) {
      throw new UnauthorizedException('Access denied. Admins only.');
    }

    const isPasswordValid = await this.usersService.validatePassword(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { email: user.email, sub: user._id.toString() };
    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        fullName: user.fullName,
        roles: user.roles,
      },
    };
  }

  async validateUser(userId: string) {
    return this.usersService.findById(userId);
  }

  async generateOtp(email: string, purpose: OtpPurpose) {
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiryTime = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await this.otpModel.create({ email, otp, purpose, expiryTime });

    // Gửi OTP bằng email HTML template
    this.sendOtpEmail(email, otp, purpose)
    .catch((err) => console.error('Failed to send OTP email:', err));

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(email: string, otp: string) {
    const record = await this.otpModel.findOne({ email, otp }).exec();
    if (!record) throw new BadRequestException('Invalid OTP');
    if (record.expiryTime < new Date())
      throw new BadRequestException('OTP expired');
    return true;
  }

  private async sendOtpEmail(email: string, otpCode: string, purpose: OtpPurpose) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    const htmlContent = this.generateHtmlContent(otpCode, purpose);

    await transporter.sendMail({
      from: `"Echo English" <${process.env.GMAIL_USER}>`,
      to: email,
      subject:
        purpose === OtpPurpose.REGISTER
          ? 'Echo English - Registration OTP'
          : 'Echo English - Password Reset OTP',
      html: htmlContent,
    });
  }

  private generateHtmlContent(otpCode: string, purpose: OtpPurpose): string {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #eee; border-radius:8px;">
        <h2 style="color:#00466a; text-align:center;">Echo English</h2>
        <p>Hi,</p>
        <p>Use the following OTP to ${
          purpose === OtpPurpose.REGISTER
            ? 'complete your registration'
            : 'reset your password'
        }. OTP is valid for ${OTP_EXPIRY_MINUTES} minutes.</p>
        <div style="text-align:center; margin:20px 0;">
          <span style="font-size:32px; font-weight:bold; color:#fff; background-color:#00466a; padding:10px 20px; border-radius:6px;">
            ${otpCode}
          </span>
        </div>
        <p>Regards,<br/>Echo English Team</p>
        <hr style="border:none; border-top:1px solid #eee; margin-top:20px;"/>
        <p style="font-size:12px; color:#aaa; text-align:center;">Echo Inc, 1600 Amphitheatre Parkway, California</p>
      </div>
    `;
    return htmlContent;
  }

}
