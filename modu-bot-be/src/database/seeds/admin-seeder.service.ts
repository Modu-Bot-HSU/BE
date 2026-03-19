// src/database/seeds/admin-seeder.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from '../../users/entities/users.entity';
import { ConfigService } from '@nestjs/config';
import { UsersRole } from 'src/users/enum/user-role.enum';

@Injectable()
export class AdminSeederService implements OnModuleInit {
  constructor(
    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.createAdmin();
  }

  async createAdmin() {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    const adminWallet = this.configService.get<string>('ADMIN_WALLET');

    if (!adminEmail || !adminWallet) {
      console.warn(
        '관리자 이메일이나 지갑 주소가 환경변수에 설정되지 않아 Seeder를 건너뜁니다.',
      );
      return;
    }

    const adminExists = await this.userRepository.findOne({
      where: { email: adminEmail },
    });

    if (!adminExists) {
      const admin = this.userRepository.create({
        email: adminEmail,
        walletAddress: adminWallet,
        role: UsersRole.ADMIN,
        name: '관리자',
        isVerified: true,
      });

      await this.userRepository.save(admin);
      console.log('초기 관리자 계정이 생성되었습니다.');
    } else {
      console.log('이미 관리자 계정이 존재합니다.');
    }
  }
}
