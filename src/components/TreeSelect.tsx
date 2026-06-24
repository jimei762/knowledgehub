import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronRight, ChevronDown, Check, Search } from 'lucide-react';
import { cn } from '../lib/utils';

export interface TreeNode {
  value: string;
  label: string;
  children?: TreeNode[];
}

interface TreeSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: TreeNode[];
  placeholder?: string;
}

export function TreeSelect({ value, onChange, options, placeholder = 'Select...' }: TreeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Filter logic
  const filteredOptions = useMemo(() => {
    if (!search) return options;
    const lowerSearch = search.toLowerCase();

    function filterNodes(nodes: TreeNode[]): TreeNode[] | null {
      const res: TreeNode[] = [];
      for (const node of nodes) {
        const matches = node.label.toLowerCase().includes(lowerSearch);
        let filteredChildren: TreeNode[] | null = null;
        if (node.children) {
          filteredChildren = filterNodes(node.children);
        }
        if (matches || (filteredChildren && filteredChildren.length > 0)) {
          res.push({
            ...node,
            children: filteredChildren || undefined,
          });
        }
      }
      return res.length > 0 ? res : null;
    }

    return filterNodes(options) || [];
  }, [options, search]);

  useEffect(() => {
    if (search) {
      // expand all when searching
      const newExpanded: Record<string, boolean> = {};
      const expandAll = (nodes: TreeNode[]) => {
        nodes.forEach(n => {
          newExpanded[n.value] = true;
          if (n.children) expandAll(n.children);
        });
      };
      expandAll(filteredOptions);
      setExpanded(newExpanded);
    }
  }, [search, filteredOptions]);

  const toggleExpand = (val: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(prev => ({ ...prev, [val]: !prev[val] }));
  };

  const renderNode = (node: TreeNode, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expanded[node.value] || false;
    const isSelected = value === node.value;

    return (
      <div key={node.value}>
        <div 
          onClick={() => {
            onChange(node.value);
            setIsOpen(false);
            setSearch('');
          }}
          className={cn(
            "flex items-center justify-between px-3 py-1.5 cursor-pointer text-sm transition-colors hover:bg-slate-100",
            isSelected && "bg-blue-50 text-blue-700 font-medium"
          )}
          style={{ paddingLeft: `${(depth * 16) + 12}px` }}
        >
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(prev => ({ ...prev, [node.value]: !prev[node.value] }));
                }}
                className="w-5 h-5 flex items-center justify-center hover:bg-slate-200/60 rounded text-slate-400 hover:text-slate-600 transition-colors border-0 bg-transparent cursor-pointer p-0 shrink-0"
              >
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            ) : (
              <span className="w-5 h-5 shrink-0"></span>
            )}
            <span className="text-slate-700 truncate">{node.label}</span>
          </div>
          {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
        </div>
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const getLabel = (val: string, nodes: TreeNode[]): string | null => {
    for (const node of nodes) {
      if (node.value === val) return node.label;
      if (node.children) {
        const found = getLabel(val, node.children);
        if (found) return found;
      }
    }
    return null;
  };

  return (
    <div className="relative" ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-800 flex items-center justify-between cursor-pointer",
          isOpen && "border-indigo-400 ring-1 ring-indigo-400"
        )}
      >
        <span className={value ? "text-slate-800" : "text-slate-400"}>
          {value ? getLabel(value, options) || value : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="p-2 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
              <input 
                autoFocus
                type="text" 
                placeholder="搜索..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 text-sm bg-white border border-slate-200 focus:border-indigo-400 rounded outline-none"
              />
            </div>
          </div>
          <div className="max-h-[200px] overflow-auto py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(node => renderNode(node, 0))
            ) : (
              <div className="px-3 py-4 text-sm text-center text-slate-400">无匹配结果</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
