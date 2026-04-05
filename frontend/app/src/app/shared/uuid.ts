export type UUID = string;
import {v4 as uuidv4} from 'uuid';

export function uuid(): UUID {
  return uuidv4()
}
