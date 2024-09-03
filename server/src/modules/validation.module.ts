import { DynamicModule, Module } from '@nestjs/common';
import { ValidationService } from '../services/validation/validation.service';

@Module({})
export class ValidationModule {
  static forRoot(): DynamicModule {
    return {
      module: ValidationModule,
      global: true,
      providers: [ValidationService],
      exports: [ValidationService],
    };
  }
}
