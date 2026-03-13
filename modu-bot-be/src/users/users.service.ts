import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from './entities/users.entity';
import { Repository } from 'typeorm';
import { CreateUsersDto } from './dto/create-users.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,
  ) {}

  async createUser(model: Partial<Users>): Promise<Users> {
    const existingUser = await this.userRepository.exists({
      where: [{ walletAddress: model.walletAddress }, { email: model.email }],
    });

    if (existingUser) {
      throw new BadRequestException('이미 가입된 주소이거나 이메일입니다.');
    }

    const userObject = this.userRepository.create(model);

    const newUser = this.userRepository.save(userObject);

    return newUser;
  }

  async getAllUsers(): Promise<Users[]> {
    return this.userRepository.find();
  }

  async getUserByEmail(email: string): Promise<Users> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException(
        `해당 ${email}을 가진 유저가 존재하지 않습니다`,
      );
    }

    return user;
  }

  async getUserById(id: string): Promise<Users> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`ID가 ${id}인 유저를 찾을 수 없습니다.`);
    }

    return user;
  }

  async getUserByWallet(walletAddress: string): Promise<Users | null> {
    return this.userRepository.findOne({
      where: { walletAddress },
    });
  }

  async saveUser(user: Users): Promise<Users> {
    return this.userRepository.save(user);
  }
}
