import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator'

export class SendFeedbackDto {
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(100, { message: 'Name must be less than 100 characters' })
  name: string

  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string

  @IsString({ message: 'Subject must be a string' })
  @IsNotEmpty({ message: 'Subject is required' })
  @MaxLength(200, { message: 'Subject must be less than 200 characters' })
  subject: string

  @IsString({ message: 'Message must be a string' })
  @IsNotEmpty({ message: 'Message is required' })
  @MaxLength(2000, { message: 'Message must be less than 2000 characters' })
  message: string
}