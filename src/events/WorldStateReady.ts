import { Injectable } from '@nestjs/common';
import type { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class WorldStateReady {
  constructor(private eventEmitter: EventEmitter2) {}
}
