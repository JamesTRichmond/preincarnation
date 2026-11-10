import type { CarryReport, InventoryNotice } from "./types.ts";

/**
 * Ports for modules this inventory does not own.
 * Interface receives discovery, notices, and the carry summary.
 * Homestead receives shared storage, the shelf, the plot, and interval retention.
 */
export interface InterfacePort {
  publish(notice: InventoryNotice): void;
  syncCarry(carry: CarryReport): void;
}

export interface HomesteadPort {
  record(text: string): void;
}

export type PortLog = { id: number; text: string };

export type MemoryPorts = {
  interfaceLog: PortLog[];
  homesteadLog: PortLog[];
  carry: CarryReport | null;
  interfacePort: InterfacePort;
  homesteadPort: HomesteadPort;
};

export function createMemoryPorts(): MemoryPorts {
  const interfaceLog: PortLog[] = [];
  const homesteadLog: PortLog[] = [];
  const bag: { carry: CarryReport | null; seq: number } = { carry: null, seq: 1 };
  return {
    interfaceLog,
    homesteadLog,
    get carry() {
      return bag.carry;
    },
    set carry(value: CarryReport | null) {
      bag.carry = value;
    },
    interfacePort: {
      publish(notice) {
        interfaceLog.unshift({ id: bag.seq++, text: notice.text });
        if (interfaceLog.length > 12) interfaceLog.length = 12;
      },
      syncCarry(carry) {
        bag.carry = carry;
      },
    },
    homesteadPort: {
      record(text) {
        homesteadLog.unshift({ id: bag.seq++, text });
        if (homesteadLog.length > 12) homesteadLog.length = 12;
      },
    },
  };
}

export function applyEffects(
  ports: MemoryPorts,
  effects: { type: string; notice?: InventoryNotice; text?: string }[],
) {
  for (const effect of effects) {
    if (effect.type === "notice" && effect.notice) ports.interfacePort.publish(effect.notice);
    if (effect.type === "homestead" && effect.text) ports.homesteadPort.record(effect.text);
  }
}
