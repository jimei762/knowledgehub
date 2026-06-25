import { useState } from "react";
import { SourceFile } from "../types";
import { ArrowLeft, MessageSquareText, History, Info, Download, Share2, MoreHorizontal, Send, FileText, CornerDownRight, ZoomIn, ZoomOut, CheckCircle2 } from "lucide-react";
import { cn } from "../lib/utils";

interface FilePreviewOverlayProps {
  file: SourceFile;
  onBack: () => void;
}

export function FilePreviewOverlay({ file, onBack }: FilePreviewOverlayProps) {
  const [activeTab, setActiveTab] = useState<'comments' | 'versions'>('comments');
  const [commentText, setCommentText] = useState("");

  const mockComments = [
    {
      id: "c1",
      author: "张三",
      avatar: "张",
      title: "关于权限控制的设计",
      content: "这个方案的第二部分需要同步修改一下，特别是关于权限控制的设计，建议拉上安全部门过一下。",
      time: "10分钟前",
      isOwner: false,
      replies: []
    },
    {
      id: "c2",
      author: "李四",
      avatar: "李",
      title: "批注：第 4 页配图",
      content: "@运营人员 这张配图的版权我们需要再确认一下，好像不是我们购买图库里的。",
      time: "昨天 14:30",
      isOwner: false,
      replies: [
        {
          id: "r1",
          author: "运营人员",
          avatar: "运",
          content: "好的，我已经联系设计同学换成行内公共图库的素材了。",
          time: "今天 09:15",
          isOwner: true
        }
      ]
    }
  ];

  return (
    <div className="flex-1 flex flex-col h-full z-20 absolute inset-0">
      {/* Header */}
      <header className="h-14 px-6 flex items-center justify-between glass-header shrink-0 relative z-30">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-800 text-sm">文件协作预览</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600 text-sm font-medium">{file.name}</span>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-sm rounded border border-slate-200">v{file.version}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
           <button className="px-3 py-1.5 text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-md text-sm font-medium transition flex items-center gap-1">
             <Share2 className="w-4 h-4"/> 协作分享
           </button>
           <button className="px-3 py-1.5 text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-md text-sm font-medium transition flex items-center gap-1">
             <Download className="w-4 h-4"/> 下载
           </button>
           <button className="p-1.5 text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-md transition">
             <MoreHorizontal className="w-4 h-4"/>
           </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Document View Pane */}
        <div className="flex-1 flex flex-col border-r border-slate-200 bg-slate-100/80 relative z-10 shadow-[inner]">
           {/* Document Toolbar */}
           <div className="h-12 border-b border-slate-200 bg-white/60 backdrop-blur px-4 flex items-center justify-center shrink-0 gap-1">
             <div className="flex bg-white border border-slate-200 rounded-md shadow-sm">
                 <button className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-l-md border-r border-slate-200 transition-colors"><ZoomOut className="w-4 h-4"/></button>
                 <span className="text-sm text-slate-600 px-3 flex items-center justify-center font-medium min-w-[3.5rem]">100%</span>
                 <button className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-r-md border-l border-slate-200 transition-colors"><ZoomIn className="w-4 h-4"/></button>
              </div>
           </div>

           {/* Document Canvas Placeholder */}
           <div className="flex-1 overflow-auto p-6 md:p-8 flex justify-center">
              <div className="w-full max-w-3xl bg-white shadow-xl ring-1 ring-slate-200 p-10 md:p-14 text-slate-800 text-sm min-h-[900px] h-max aspect-[1/1.414]">
                 <div className="flex items-center justify-center h-full flex-col text-slate-400 gap-3">
                    <FileText className="w-16 h-16 text-slate-300" />
                    <p>文档实时预览区域（原生格式呈现）</p>
                    <p className="text-sm">支持框选内容添加协同批注</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Right: Collaboration & Details Pane */}
        <div className="w-[380px] bg-white flex flex-col shrink-0 relative z-20 shadow-[-8px_0_20px_-10px_rgba(0,0,0,0.05)]">
           <div className="flex px-2 pt-2 border-b border-slate-200 bg-slate-50">
             <button
               onClick={() => setActiveTab('comments')}
               className={cn("px-4 py-2.5 text-sm font-medium border-b-2 transition-all flex items-center gap-1", activeTab === 'comments' ? "border-blue-600 text-blue-700 bg-white" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-white")}
             >
               <MessageSquareText className="w-4 h-4" /> 评论与批注
             </button>
             <button
               onClick={() => setActiveTab('versions')}
               className={cn("px-4 py-2.5 text-sm font-medium border-b-2 transition-all flex items-center gap-1", activeTab === 'versions' ? "border-blue-600 text-blue-700 bg-white" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-white")}
             >
               <History className="w-4 h-4" /> 历史版本
             </button>
           </div>

           <div className="flex-1 overflow-auto bg-slate-50">
              {activeTab === 'comments' && (
                <div className="p-3 space-y-6">
                   {mockComments.map(comment => (
                     <div key={comment.id} className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm group">
                        <div className="flex items-start gap-3 mb-2">
                           <div className={cn(
                             "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white shadow-sm shrink-0",
                             comment.author === '张三' ? 'bg-indigo-500' : 'bg-emerald-500'
                           )}>
                             {comment.avatar}
                           </div>
                           <div className="flex-1 min-w-0">
                             <div className="flex items-center justify-between">
                               <span className="font-semibold text-slate-800 text-sm">{comment.author}</span>
                               <span className="text-sm text-slate-400">{comment.time}</span>
                             </div>
                             <h4 className="text-sm font-medium text-slate-600 truncate mt-0.5">{comment.title}</h4>
                           </div>
                        </div>
                        <p className="text-sm text-slate-700 pl-11 mb-3 leading-relaxed">
                          {comment.content}
                        </p>
                        
                        {/* Replies */}
                        {comment.replies.length > 0 && (
                          <div className="pl-6 mt-3 space-y-3 border-l-2 border-slate-100">
                             {comment.replies.map(reply => (
                               <div key={reply.id} className="pl-4 flex items-start gap-1">
                                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-sm font-medium text-white shadow-sm shrink-0">
                                     {reply.avatar}
                                  </div>
                                  <div className="flex-1 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-medium text-slate-800 text-sm">{reply.author}</span>
                                      <span className="text-sm text-slate-400">{reply.time}</span>
                                    </div>
                                    <p className="text-sm text-slate-600 leading-normal">{reply.content}</p>
                                  </div>
                               </div>
                             ))}
                          </div>
                        )}

                        <div className="pl-11 mt-3 flex items-center gap-3">
                           <button className="text-sm font-medium text-slate-400 hover:text-blue-600 transition">回复</button>
                           <button className="text-sm font-medium text-slate-400 hover:text-teal-600 transition flex items-center gap-1">
                             <CheckCircle2 className="w-3.5 h-3.5"/> 标记解决
                           </button>
                        </div>
                     </div>
                   ))}
                </div>
              )}

              {activeTab === 'versions' && (
                <div className="p-3 space-y-4">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-sm font-semibold rounded border border-blue-200">当前版本 (v1.2)</span>
                      <span className="text-sm text-slate-500 font-mono">2026-06-10 10:20</span>
                    </div>
                    <p className="text-sm font-medium text-slate-800">更新文案与替换涉及版权的配图</p>
                    <div className="mt-3 flex items-center gap-1">
                      <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-medium">运</div>
                      <span className="text-sm text-slate-600">运营人员 创建</span>
                    </div>
                  </div>

                  <div className="p-3 bg-transparent border border-slate-200 rounded-xl hover:bg-white transition relative">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-slate-600">历史版本 (v1.1)</span>
                      <span className="text-sm text-slate-500 font-mono">2026-06-08 16:45</span>
                    </div>
                    <p className="text-sm text-slate-700">补充活动细则与权限申请要求</p>
                    <div className="mt-3 justify-between flex items-center">
                      <div className="flex items-center gap-1">
                        <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-medium">李</div>
                        <span className="text-sm text-slate-600">李四 创建</span>
                      </div>
                      <button className="text-sm font-medium text-blue-600 opacity-0 group-hover:opacity-100">恢复此版本</button>
                    </div>
                  </div>

                  <div className="p-3 bg-transparent border border-slate-200 rounded-xl hover:bg-white transition relative">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-slate-600">历史版本 (v1.0)</span>
                      <span className="text-sm text-slate-500 font-mono">2026-06-07 09:00</span>
                    </div>
                    <p className="text-sm text-slate-700">初稿上传</p>
                    <div className="mt-3 justify-between flex items-center">
                      <div className="flex items-center gap-1">
                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-medium">张</div>
                        <span className="text-sm text-slate-600">张三 创建</span>
                      </div>
                      <button className="text-sm font-medium text-blue-600 opacity-0 group-hover:opacity-100">恢复此版本</button>
                    </div>
                  </div>
                </div>
              )}
           </div>

           {/* Input Area (Only for Comments) */}
           {activeTab === 'comments' && (
             <div className="p-3 border-t border-slate-200 bg-white">
                <div className="relative">
                  <textarea 
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="添加评论、@提及成员..." 
                    className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none min-h-[80px]"
                  />
                  <button 
                    disabled={!commentText.trim()}
                    className="absolute right-3 bottom-3 p-1.5 bg-blue-600 text-white rounded-md disabled:opacity-50 disabled:bg-slate-300 transition-colors"
                  >
                    <Send className="w-4 h-4 shadow-sm" />
                  </button>
                </div>
                <p className="text-sm text-slate-400 mt-2 flex items-center gap-1">
                  框选左侧文档内容即可添加针对性批注
                </p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
