import fs from "fs";
import path from "path";

const walkSync = (dir: string, filelist: string[] = []) => {
  fs.readdirSync(dir).forEach(file => {
    filelist = fs.statSync(path.join(dir, file)).isDirectory()
      ? walkSync(path.join(dir, file), filelist)
      : filelist.concat(path.join(dir, file));
  });
  return filelist;
}

const files = walkSync("./src").filter(f => f.endsWith(".tsx") || f.endsWith(".ts"));

files.forEach(file => {
  let content = fs.readFileSync(file, "utf8");
  let original = content;

  // Typography - Bump fonts to match Enterprise DS 
  // Body -> 14px (text-sm)
  content = content.replace(/\btext-\[1[0-1]px\]/g, "text-sm");
  content = content.replace(/\btext-xs\b/g, "text-sm"); 

  // Make sure we have 16px headers where it makes sense.
  // Many titles currently use text-sm or text-[15px]
  content = content.replace(/\btext-\[15px\]/g, "text-base");
  content = content.replace(/\btext-\[16px\]/g, "text-base");
  
  // Reduce font weights. The current UI uses font-medium everywhere.
  content = content.replace(/\bfont-medium\b/g, "font-semibold");
  content = content.replace(/\bfont-medium\b/g, "font-medium");
  content = content.replace(/\bfont-medium\b/g, "font-medium");
  
  // Radius and shadows
  // Card: radius 12px (rounded-xl), padding 16px (p-4), soft shadow
  content = content.replace(/\brounded-2xl\b/g, "rounded-xl");
  content = content.replace(/\brounded-\[24px\]/g, "rounded-xl");
  content = content.replace(/\bshadow-2xl\b/g, "shadow-sm border border-[#DEE0E5]");
  content = content.replace(/\bshadow-xl\b/g, "shadow-sm border border-[#DEE0E5]");
  
  // Layout gaps
  content = content.replace(/\bgap-6\b/g, "gap-4"); // Section Gap 16px
  content = content.replace(/\bgap-8\b/g, "gap-6"); 
  
  // Colors (Simple replacements for inline classes)
  // Primary: #6473FF
  content = content.replace(/\btext-blue-600\b/g, "text-[#6473FF]");
  content = content.replace(/\bbg-blue-600\b/g, "bg-[#6473FF]");
  content = content.replace(/\bbg-blue-500\b/g, "bg-[#6473FF]");
  content = content.replace(/\bbg-blue-700\b/g, "bg-[#505CE6]");
  content = content.replace(/\bhover:bg-blue-700\b/g, "hover:bg-[#505CE6]");
  content = content.replace(/\btext-blue-700\b/g, "text-[#505CE6]");
  content = content.replace(/\btext-blue-500\b/g, "text-[#6473FF]");
  
  // Text Colors
  content = content.replace(/\btext-slate-900\b/g, "text-[#222222]");
  content = content.replace(/\btext-slate-800\b/g, "text-[#222222]");
  content = content.replace(/\btext-slate-700\b/g, "text-[#222222]");
  content = content.replace(/\btext-slate-600\b/g, "text-[#4B505A]");
  content = content.replace(/\btext-slate-500\b/g, "text-[#4B505A]");
  content = content.replace(/\btext-slate-400\b/g, "text-[#4B505A]");
  
  // Background Colors
  content = content.replace(/\bbg-slate-50\b/g, "bg-[#F7F9FC]");
  content = content.replace(/\bbg-\[\#f8fafc\]\b/g, "bg-[#F7F9FC]");
  
  // Borders
  content = content.replace(/\bborder-slate-100\b/g, "border-[#DEE0E5]");
  content = content.replace(/\bborder-slate-200\b/g, "border-[#DEE0E5]");
  content = content.replace(/\bborder-slate-150\/80\b/g, "border-[#DEE0E5]");

  // Max-Width
  content = content.replace(/\bmax-w-\[1240px\]\b/g, "max-w-[1440px]");

  if (content !== original) {
    fs.writeFileSync(file, content, "utf8");
  }
});
