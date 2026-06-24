import React, { useState } from 'react';
import { Search, ChevronDown, ChevronRight, X, Users, User, Info, HelpCircle, ShieldCheck, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface Member {
  id: string;
  name: string;
  avatar?: string;
  type: 'user' | 'group';
  dept?: string;
}

interface DeptNode {
  id: string;
  name: string;
  children: Member[];
  isOpen?: boolean;
}

interface MemberSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selected: any[]) => void;
  title?: string;
  mode?: 'member' | 'department' | 'role' | 'position';
}

export const MemberSelectorModal: React.FC<MemberSelectorModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "选择成员",
  mode = 'member'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openDepts, setOpenDepts] = useState<string[]>(['dept_ops']);

  // Dynamic Content based on Mode
  const getModalContent = () => {
    switch (mode) {
      case 'department':
        return {
          title: "选择部门范围",
          searchPlaceholder: "搜索部门或中心名称...",
          data: [
            { id: 'd1', name: '总行人力资源部', type: 'dept' },
            { id: 'd2', name: '总行数字化发展部', type: 'dept' },
            { id: 'd3', name: '上海分行', type: 'dept' },
            { id: 'd4', name: '北京分行', type: 'dept' },
            { id: 'd5', name: '深圳分行', type: 'dept' },
            { id: 'd6', name: '广州分行运营中心', type: 'dept' },
          ]
        };
      case 'role':
        return {
          title: "选择角色范围",
          searchPlaceholder: "搜索系统角色...",
          data: [
            { id: 'r1', name: '系统管理员', type: 'role' },
            { id: 'r2', name: '普通员工', type: 'role' },
            { id: 'r3', name: '部门主管', type: 'role' },
            { id: 'r4', name: '审计人员', type: 'role' },
            { id: 'r5', name: '外部协作人员', type: 'role' },
          ]
        };
      case 'position':
        return {
          title: "选择岗位范围",
          searchPlaceholder: "搜索业务岗位...",
          data: [
            { id: 'p1', name: '对公客户经理', type: 'position' },
            { id: 'p2', name: '柜面业务员', type: 'position' },
            { id: 'p3', name: '支行行长', type: 'position' },
            { id: 'p4', name: '合规审查岗', type: 'position' },
            { id: 'p5', name: '技术开发岗', type: 'position' },
          ]
        };
      default:
        return null;
    }
  };

  const modeContent = getModalContent();

  // Mock Data for "Member" mode
  const mockMemberData: DeptNode[] = [
    {
      id: 'dept_legal',
      name: '法务合规部',
      children: [
        { id: 'user_1', name: '张益达', type: 'user', dept: '法务部' },
        { id: 'user_5', name: '李理', type: 'user', dept: '法务部' },
      ]
    },
    {
      id: 'dept_market',
      name: '市场营销中心',
      children: [
        { id: 'user_2', name: '王漫妮', type: 'user', dept: '市场部' },
        { id: 'user_6', name: '赵小亮', type: 'user', dept: '市场部' },
      ]
    },
    {
      id: 'dept_ops',
      name: '数字化运营部',
      children: [
        { id: 'user_3', name: '宋吉美', type: 'user', dept: '运营部' },
        { id: 'user_4', name: '陈也', type: 'user', dept: '运营部' },
      ]
    }
  ];

  const handleToggleDept = (id: string) => {
    setOpenDepts(prev => 
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const handleToggleSelect = (item: any) => {
    setSelectedIds(prev => 
      prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
    );
  };

  const handleToggleDeptSelect = (dept: DeptNode) => {
    const childIds = dept.children.map(c => c.id);
    const allSelected = childIds.every(id => selectedIds.includes(id));
    
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !childIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...childIds])));
    }
  };

  const getSelectedItems = () => {
    if (mode === 'member') {
      const allMembers = mockMemberData.flatMap(d => d.children);
      return allMembers.filter(item => selectedIds.includes(item.id));
    } else {
      return modeContent?.data.filter(item => selectedIds.includes(item.id)) || [];
    }
  };

  const selectedItems = getSelectedItems();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-[800px] h-[600px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <span className="font-medium text-slate-800 tracking-normal">{title}</span>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Search & Tree */}
          <div className="w-[380px] border-r border-slate-100 flex flex-col bg-slate-50/30">
            <div className="p-3">
              <div className="relative text-left">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder={modeContent?.searchPlaceholder || "搜索成员或部门"} 
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-auto px-4 pb-4 space-y-1 text-left">
              {mode === 'member' ? (
                mockMemberData.map(dept => (
                  <div key={dept.id} className="space-y-1">
                    <div className="flex items-center hover:bg-white hover:shadow-sm rounded-xl px-3 py-2.5 cursor-pointer transition-all border border-transparent group">
                      <button 
                        onClick={() => handleToggleDept(dept.id)}
                        className="p-1 hover:bg-slate-100 rounded-lg transition-colors mr-2 text-slate-400 group-hover:text-slate-600"
                      >
                        {openDepts.includes(dept.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                      
                      <div 
                        className="flex-1 flex items-center gap-1"
                        onClick={() => handleToggleDept(dept.id)}
                      >
                        <span className="text-sm font-medium text-slate-800 tracking-normal">{dept.name}</span>
                      </div>

                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 transition-colors cursor-pointer"
                        checked={dept.children.length > 0 && dept.children.every(c => selectedIds.includes(c.id))}
                        onChange={() => handleToggleDeptSelect(dept)}
                      />
                    </div>

                    <AnimatePresence>
                      {openDepts.includes(dept.id) && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pl-8 space-y-1 py-1">
                            {dept.children.map(child => (
                              <div 
                                key={child.id}
                                onClick={() => handleToggleSelect(child)}
                                className={cn(
                                  "flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all border",
                                  selectedIds.includes(child.id) 
                                  ? "bg-blue-50/50 border-blue-100" 
                                  : "hover:bg-white hover:shadow-sm border-transparent"
                                )}
                              >
                                <input 
                                  type="checkbox" 
                                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 pointer-events-none"
                                  checked={selectedIds.includes(child.id)}
                                  readOnly
                                />
                                <span className="text-sm font-medium text-slate-600">{child.name}</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))
              ) : (
                <div className="space-y-1 pt-1">
                  {modeContent?.data.filter(item => item.name.includes(searchQuery)).map(item => (
                    <div 
                      key={item.id}
                      onClick={() => handleToggleSelect(item)}
                      className={cn(
                        "flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all border",
                        selectedIds.includes(item.id) 
                        ? "bg-blue-50 border-blue-200" 
                        : "bg-white hover:shadow-sm border-slate-100 hover:border-slate-200"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                          selectedIds.includes(item.id) ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
                        )}>
                          {mode === 'department' && <Users className="w-4 h-4" />}
                          {mode === 'role' && <ShieldCheck className="w-4 h-4" />}
                          {mode === 'position' && <UserPlus className="w-4 h-4" />}
                        </div>
                        <span className="text-sm font-medium text-slate-800">{item.name}</span>
                      </div>
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 pointer-events-none"
                        checked={selectedIds.includes(item.id)}
                        readOnly
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Selection Preview */}
          <div className="flex-1 flex flex-col bg-white">
            <div className="p-6 text-left border-b border-slate-50">
              <h3 className="text-sm font-medium text-slate-800 tracking-normal">请选择需要添加的数据</h3>
            </div>

            <div className="flex-1 overflow-auto p-3">
              {selectedItems.length > 0 ? (
                <div className="grid grid-cols-1 gap-1">
                  {selectedItems.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100 text-left hover:bg-white transition-all shadow-sm">
                       <div className="flex items-center gap-3">
                          <div>
                            <div className="text-sm font-medium text-slate-900">{item.name}</div>
                            {item.dept && <div className="text-sm text-slate-400 font-medium uppercase tracking-wider">{item.dept}</div>}
                            {item.type === 'role' && <div className="text-sm text-blue-400 font-medium uppercase tracking-wider">系统角色</div>}
                            {item.type === 'position' && <div className="text-sm text-indigo-400 font-medium uppercase tracking-wider">业务岗位</div>}
                          </div>
                       </div>
                       <button 
                        onClick={() => handleToggleSelect(item)}
                        className="p-1.5 hover:bg-slate-200 rounded-xl text-slate-300 hover:text-rose-500 transition-colors"
                       >
                         <X className="w-4 h-4" />
                       </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center space-y-4">
                  <div className="w-40 h-40 opacity-10">
                    <Users className="w-full h-full text-slate-900" strokeWidth={1} />
                  </div>
                  <p className="text-sm font-medium text-slate-300 tracking-wide">暂未选择任何数据</p>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="p-6 pt-0 flex justify-end gap-3 mt-auto">
              <button 
                onClick={onClose}
                className="px-6 py-2.5 border border-slate-200 text-slate-500 rounded-xl text-sm font-medium hover:bg-slate-50 transition"
              >
                取消
              </button>
              <button 
                onClick={() => {
                  onConfirm(selectedItems);
                  onClose();
                }}
                className={cn(
                  "px-8 py-2.5 rounded-xl text-sm font-medium transition-all",
                  selectedItems.length > 0 
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-100" 
                  : "bg-slate-100 text-slate-300 cursor-not-allowed"
                )}
                disabled={selectedItems.length === 0}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
