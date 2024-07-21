import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class AppService {
  constructor(private readonly cls: ClsService) {}

  test() {}
}
