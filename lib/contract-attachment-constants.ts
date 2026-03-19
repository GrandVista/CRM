/** 合同附件分类：已签署合同 PDF 留档 */
export const CONTRACT_ATTACHMENT_CATEGORY = {
  SIGNED_CONTRACT: "SIGNED_CONTRACT",
} as const;

export type ContractAttachmentCategory = (typeof CONTRACT_ATTACHMENT_CATEGORY)[keyof typeof CONTRACT_ATTACHMENT_CATEGORY];

/** 允许的 MIME 类型 */
export const ALLOWED_PDF_MIME = "application/pdf";

/** 最大文件大小 10MB */
export const MAX_SIGNED_CONTRACT_PDF_SIZE = 10 * 1024 * 1024;
