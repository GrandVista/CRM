/** 出货状态：枚举值与前端显示文案 */
export const SHIPMENT_STATUS_OPTIONS = [
  { value: "BOOKED" as const, label: "订舱" },
  { value: "STUFFED" as const, label: "装柜" },
  { value: "SAILED" as const, label: "离港" },
] as const;

export type ShipmentStatusOption = (typeof SHIPMENT_STATUS_OPTIONS)[number]["value"];
