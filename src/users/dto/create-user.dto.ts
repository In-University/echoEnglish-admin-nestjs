import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
  IsDateString,
  Matches,
  IsArray,
  IsMongoId,
} from 'class-validator';
import { Gender } from '../../common/enums/gender.enum';

export class CreateUserDto {
  @IsNotEmpty({ message: 'FULL_NAME_REQUIRED' })
  @IsString()
  fullName: string;

  @IsOptional()
  @IsEnum(Gender, { message: 'GENDER_INVALID' })
  gender?: Gender;

  @IsOptional()
  @IsDateString({}, { message: 'DOB_INVALID' })
  dob?: string;

  @IsEmail({}, { message: 'EMAIL_INVALID' })
  @IsNotEmpty({ message: 'EMAIL_REQUIRED' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'PASSWORD_INVALID' })
  @MaxLength(100, { message: 'PASSWORD_INVALID' })
  @IsNotEmpty({ message: 'PASSWORD_REQUIRED' })
  password: string;

  @IsOptional()
  @IsString()
  @Matches(/^(0|\+84)(3|5|7|8|9)[0-9]{8}$/, {
    message: 'PHONE_NUMBER_INVALID',
  })
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  roles?: string[];
}
