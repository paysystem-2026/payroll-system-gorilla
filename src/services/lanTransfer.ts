import { invokeCommand } from "@/services/tauri";
import type { LanDevice, PairingRequest, PairingSession } from "@/types/lanTransfer";

export const lanTransferService = {
  getDevice() {
    return invokeCommand<LanDevice>("get_lan_device", {}, {
      device_id: "preview-device",
      device_name: "This Device",
      ip_address: "This device",
      app_version: "1.0.0",
      protocol: "PAYROLL_LAN_V1",
    });
  },
  discover() { return invokeCommand<LanDevice[]>("discover_lan_devices", {}, []); },
  requestPairing(device: LanDevice) { return invokeCommand<PairingSession>("request_lan_pairing", { device }, null as unknown as PairingSession); },
  pairingRequests() { return invokeCommand<PairingRequest[]>("get_lan_pairing_requests", {}, []); },
  approvePairing(deviceId: string, code: string) { return invokeCommand<{state:string;device_id:string|null;device_name:string|null;message:string}>("approve_lan_pairing", { device_id: deviceId, code }, null as never); },
  pairedDevices() { return invokeCommand<LanDevice[]>("get_paired_lan_devices", {}, []); },
  sendBackup(backupId: number, deviceId: string) { return invokeCommand<void>("send_lan_backup", { backup_id: backupId, device_id: deviceId }, undefined); },
  testConnection(deviceId: string) { return invokeCommand<LanDevice>("test_lan_connection", { device_id: deviceId }, null as unknown as LanDevice); },
  revokeDevice(deviceId: string) { return invokeCommand<void>("revoke_lan_device", { device_id: deviceId }, undefined); },
  importBackup(backupId: number) { return invokeCommand<{success:boolean;message:string}>("import_lan_backup", { backup_id: backupId }, { success:false, message:"LAN import is available in the desktop app." }); },
  history() { return invokeCommand<Array<{id:number;direction:string;file_name:string;file_size:number;status:string;created_at:string;device_name:string}>>("get_lan_transfer_history", {}, []); },
};
