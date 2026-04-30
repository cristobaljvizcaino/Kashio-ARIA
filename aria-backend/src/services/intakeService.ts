import * as intakeRepository from '../repositories/intakeRepository';
import type { IntakeRequest } from '../types/intake';

export async function listAll(): Promise<IntakeRequest[]> {
  return intakeRepository.findAll();
}
