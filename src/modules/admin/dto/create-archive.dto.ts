import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsNotEmpty, IsEnum, IsOptional, IsEmail } from 'class-validator';
import { ProjectCategory } from 'src/entities/archive.entity';

export class CreateArchiveDto {
  @ApiProperty({ description: 'Title of the project' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Author of the project' })
  @IsString()
  @IsNotEmpty()
  author: string;

  @ApiProperty({description: 'Email of author'})
  @IsEmail()
  @IsOptional()
  email?: string

  @ApiProperty({
    enum: ProjectCategory,
    description: 'Category of the project',
  })
  @IsEnum(ProjectCategory)
  @IsNotEmpty()
  category: ProjectCategory;

  // @ApiProperty({ description: 'Department project is associated with' })
  // @IsString()
  // @IsNotEmpty()
  // department: string;

  @ApiProperty({ description: 'Supervisor of the project' })
  @IsString()
  @IsNotEmpty()
  supervisedBy: string;

  @ApiProperty({ description: 'Year project was written' })
  @IsInt()
  @IsNotEmpty()
  year: number;

  @ApiProperty({ description: 'Abstract of the project' })
  @IsString()
  @IsNotEmpty()
  abstract: string;

  @ApiProperty({ description: 'Introduction of the project' })
  @IsString()
  @IsNotEmpty()
  introduction: string;

  @ApiProperty({ description: 'File path of the archive' })
  @IsString()
  @IsNotEmpty()
  filePath: string;
}
