import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User, UserDocument } from '../../database/user.schema';
import { Role, RoleDocument } from '../../database/role.schema';
import { Otp, OtpDocument } from '../../database/otp.schema';
import { OtpPurpose } from '../../common/enums/otp-purpose.enum';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { omit } from 'lodash';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';

const OTP_EXPIRY_MINUTES = 5;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly rolesService: RolesService,
    private readonly jwtService: JwtService,
    @InjectModel(Otp.name) private readonly otpModel: Model<OtpDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isAdmin = user.roles.some((role: any) => role.name === 'ADMIN');

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
    this.sendOtpEmail(email, otp, purpose).catch((err) =>
      console.error('Failed to send OTP email:', err),
    );

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(email: string, otp: string) {
    const record = await this.otpModel.findOne({ email, otp }).exec();
    if (!record) throw new BadRequestException('Invalid OTP');
    if (record.expiryTime < new Date())
      throw new BadRequestException('OTP expired');
    return true;
  }



  async verifyRegistrationOtp(email: string, otp: string) {
    // Verify the OTP for registration
    const otpRecord = await this.otpModel.findOne({ 
      email, 
      otp,
      purpose: OtpPurpose.REGISTER 
    }).exec();
    
    if (!otpRecord) throw new BadRequestException('Invalid OTP');
    if (otpRecord.expiryTime < new Date()) throw new BadRequestException('OTP expired');

  // Find the user and set isDeleted = false
  const user = await this.userModel.findOne({ email: email.toLowerCase() }).populate('roles').exec();
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Update user to active
    await this.usersService.updateUser(user._id.toString(), { isDeleted: false });

    // Return user info
    return {
      message: 'Registration completed successfully',
      user: {
        id: user._id.toString(),
        email: user.email,
        fullName: user.fullName,
      },
    };
  }

  async resendRegistrationOtp(email: string) {
    // Check if email has a pending registration OTP
    const existingOtp = await this.otpModel.findOne({
      email,
      purpose: OtpPurpose.REGISTER,
    });

    // Generate new OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiryTime = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    if (existingOtp) {
      // Update existing OTP
      await this.otpModel.updateOne(
        { email, purpose: OtpPurpose.REGISTER },
        { otp, expiryTime },
      );
    } else {
      // Create new OTP
      await this.otpModel.create({
        email,
        otp,
        purpose: OtpPurpose.REGISTER,
        expiryTime,
      });
    }

    this.sendOtpEmail(email, otp, OtpPurpose.REGISTER).catch((err) =>
      console.error('Failed to resend registration OTP email:', err),
    );

    return { message: 'OTP resent successfully' };
  }

  async registerAdmin(registerDto: RegisterDto) {
    if (registerDto.email == null || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerDto.email)) {
      throw new BadRequestException('Invalid email');
    }
    if (registerDto.password == null || registerDto.password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }
    const existUser = await this.userModel.findOne({ email: registerDto.email.toLowerCase() });
    const hashPassword = await bcrypt.hash(registerDto.password, 10);

    if (existUser) {
      if (existUser.isDeleted === false) {
        throw new ConflictException('User existed');
      }
      const otp = crypto.randomInt(100000, 999999).toString();
      const expiryTime = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
      await this.otpModel.create({ email: existUser.email, otp, purpose: OtpPurpose.REGISTER, expiryTime });
      this.sendOtpEmail(existUser.email, otp, OtpPurpose.REGISTER).catch((err) =>
        console.error('Failed to send OTP email:', err),
      );
      const populatedUser = await this.userModel.populate(existUser, {
        path: 'roles',
        populate: { path: 'permissions' },
      });
      const userResponse = populatedUser.toObject();
      return omit(userResponse, ['password', 'isDeleted', '__v']);
    }

    const adminRole = await this.roleModel.findOne({ name: 'ADMIN' }).populate('permissions').exec();
    if (!adminRole) {
      throw new BadRequestException('Role not found');
    }

    const user = new this.userModel({
      fullName: registerDto.fullName,
      email: registerDto.email.toLowerCase(),
      password: hashPassword,
      phoneNumber: registerDto.phoneNumber,
      address: registerDto.address,
      isDeleted: true,
      roles: [adminRole._id],
    });
    const savedUser = await user.save();
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiryTime = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    await this.otpModel.create({ email: savedUser.email, otp, purpose: OtpPurpose.REGISTER, expiryTime });
    this.sendOtpEmail(savedUser.email, otp, OtpPurpose.REGISTER).catch((err) =>
      console.error('Failed to send OTP email:', err),
    );
    const populatedUser = await this.userModel.populate(savedUser, {
      path: 'roles',
      populate: { path: 'permissions' },
    });

    return omit(populatedUser.toObject(), ['password', 'isDeleted', '__v']);
  }

  private async sendOtpEmail(
    email: string,
    otpCode: string,
    purpose: OtpPurpose,
  ) {
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
    console.log(`OTP email sent to ${email} for purpose ${purpose}`);
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
