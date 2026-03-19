import React from "react";

const contentClass = "flex-1 min-w-0 whitespace-pre-line break-words";

type Props = {
  label: React.ReactNode;
  children: React.ReactNode;
  /** 标签列宽度，保证所有条款内容左边缘对齐。默认 12rem 适配中英文标签 */
  labelWidth?: string;
  className?: string;
};

/**
 * 条款行：左侧固定宽度标签，右侧多行内容（保留换行、自动换行）。
 * 用于合同文档、详情页等，保证所有“标签: 内容”结构对齐一致。
 */
export function ContractClauseRow({
  label,
  children,
  labelWidth = "12rem",
  className = "",
}: Props) {
  return (
    <div className={`flex gap-2 items-start ${className}`}>
      <span
        className="shrink-0 font-semibold"
        style={{ width: labelWidth, minWidth: labelWidth }}
      >
        {label}
      </span>
      <div className={contentClass}>{children}</div>
    </div>
  );
}
