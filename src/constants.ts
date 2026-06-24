
import { TreeNode } from "./components/TreeSelect";

export const ENTITY_TYPE_OPTIONS: TreeNode[] = [
  {
    value: "contract",
    label: "合同 (Contract)",
    children: [
      { value: "business_contract", label: "商务合同" },
      { value: "labor_contract", label: "劳动合同" },
      { value: "nda", label: "保密协议 (NDA)" },
    ]
  },
  {
    value: "report",
    label: "研报 (Research Report)",
    children: [
      { value: "industry_report", label: "行业研报" },
      { value: "company_report", label: "公司研报" },
      { value: "macro_report", label: "宏观研报" },
    ]
  },
  {
    value: "document",
    label: "公文 (Official Document)",
    children: [
      { value: "red_header", label: "红头文件" },
      { value: "internal_notice", label: "内部通知" },
      { value: "meeting_minutes", label: "会议纪要" },
    ]
  },
  {
    value: "financial",
    label: "财务凭证 (Financial)",
    children: [
      { value: "invoice", label: "发票 (Invoice)" },
      { value: "receipt", label: "收据 (Receipt)" },
      { value: "bank_statement", label: "银行流水" },
    ]
  }
];

export const MOCK_RECORDS = {
  recent: [
    { id: 'file1', name: 'UDA_运营平台PRD_v1.pdf', type: 'file', format: 'pdf', kbId: 'kb-1', kbName: '运营制度规范', kbType: 'public', time: '刚访问过' },
    { id: 'note1', name: '运营目标草案', type: 'kb', format: 'md', kbId: 'kb-2', kbName: '个人私有库', kbType: 'personal', time: '2 小时前' },
    { id: 'file5', name: '年度预算测算.xlsx', type: 'file', format: 'xlsx', kbId: 'kb-3', kbName: '财务管理中心', kbType: 'team', time: '昨天' },
  ],
  todo: [
    { 
      id: 't4', 
      title: 'OCR 实体类型未判定', 
      fileName: '战略合作框架协议_v2.pdf', 
      kbName: '合同档案库', 
      kbId: 'kb-3',
      fileId: 'file4',
      type: 'ocr', 
      urgency: 'high', 
      time: '15 分钟前',
      detail: {
        ocrText: "各方经过友好协商，就共同推进AIGC领域的技术研发与商业化合作，达成如下战略合作框架协议。\n甲方：云端科技有限公司\n乙方：智联数据集团",
        ocrEntityType: ""
      }
    },
    { 
      id: 't1', 
      title: '待复核：PRD 核心口径 (3 个)', 
      fileName: 'UDA_运营平台PRD_v1.pdf', 
      kbName: '核心制度规范', 
      kbId: 'kb-1',
      fileId: 'file1',
      type: 'slice', 
      urgency: 'high', 
      time: '10 分钟前',
      detail: {
        rawText: "本规范旨在保障UDA核心运营系统之日常稳健运行，详细规定了异常响应时间、备份灾备节点激活流程。其中在A级重大故障下，主备节点倒换时效窗口控制在5分钟以内...",
        slices: [
          { id: 's1_1', text: "保障UDA核心运营系统日常稳健运行，制定重大故障下的核心运行规范...", score: 0.95 },
          { id: 's1_2', text: "A级重大故障下违规响应及异地灾备应急演练激活，主备切换在5分钟内完成...", score: 0.88 },
          { id: 's1_3', text: "本操作手册仅对具有二级及以上安全管理员证书的后台运营工程师开放授权...", score: 0.72 }
        ]
      }
    },
    { 
      id: 't2', 
      title: '摘要置信度较低 (45%)', 
      fileName: '会议纪要_0607.docx', 
      kbName: '个人整理资料', 
      kbId: 'kb-2',
      fileId: 'file3',
      type: 'summary', 
      urgency: 'medium', 
      time: '2 小时前',
      detail: {
        proposedSummary: "会议就2026年度二季度线上零售渠道营销费用追加预算进行了激烈讨论。最终批准在西南、华南两个大区增加各30万元的网点推介补贴，用于地推配合及礼品发放。",
        tags: ["零售营销", "预算追加", "2026二季度", "会议记录"],
        confidenceScore: "45%"
      }
    },
    { 
      id: 't3', 
      title: '压缩包编码冲突及图层解析失败', 
      fileName: '营销素材_设计稿.zip', 
      kbName: '核心制度规范', 
      kbId: 'kb-1',
      fileId: 'file2',
      type: 'governance', 
      urgency: 'high', 
      time: '3 小时前',
      detail: {
        errorCode: 'ERR_ENCODING_DECODE_ERR',
        errorMessage: '该压缩文件解包过程中检测到非 UTF-8 编码文件名（GBK 冲突），且首层包含未经过平面化处理的 PSD 多图层大型素材文件（500MB+），导致图层解析内存耗尽，系统流程挂起中断。',
        fileSize: '14.8 MB',
        remediations: [
          { id: 'rem1', title: '智能转码并强制重试', desc: '采用系统底层解包预案，以 GBK 补丁运行解包，提取内容并完成无损重试。' },
          { id: 'rem2', title: '运行 OCR 及素材全提取', desc: '跳过大图层渲染深度，采用高速图像引擎对多维度图层单独触发 OCR 实体解析与特征归纳入库。' },
          { id: 'rem3', title: '直接拦截并驳回', desc: '挂起并标记该文件为待整改异常，自动发送整改通知和自检规范邮件至林珊的邮箱及协同通知。' }
        ]
      }
    }
  ],
  favorites: [
    { id: 'file1', name: 'UDA_运营平台PRD_v1.pdf', type: 'file', format: 'pdf', kbId: 'kb-1', kbName: '运营制度规范', kbType: 'public', addedAt: '2026-06-01', memo: '每月零售活动通用复盘，非常实用的格式', tag: '模板参考' },
    { id: 'note1', name: '运营目标草案', type: 'kb', format: 'md', kbId: 'kb-2', kbName: '个人私有库', kbType: 'team', addedAt: '2026-05-15', memo: '分行开门红活动策划总览', tag: '高频常用' }
  ]
};
