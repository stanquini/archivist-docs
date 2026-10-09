import { Transform } from 'class-transformer';
import {
  IsByteLength,
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
} from 'class-validator';

export class CreateUserDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'email inválido' })
  readonly email: string;

  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'a senha deve ter no mínimo 8 caracteres, com ao menos 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial',
    },
  )
  @IsByteLength(0, 72, {
    message: 'a senha deve ter no máximo 72 bytes',
  })
  readonly password: string;
}
