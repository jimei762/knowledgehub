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

  // Replace explicit pixel sizes
  content = content.replace(/text-\[10px\]/g, "text-sm");
  content = content.replace(/text-\[11px\]/g, "text-sm");
  content = content.replace(/text-\[12px\]/g, "text-sm");
  content = content.replace(/text-\[13px\]/g, "text-sm");
  
  // Replace Tailwind specific sizes
  content = content.replace(/\btext-xs\b/g, "text-sm");
  content = content.replace(/\btext-sm\b/g, "text-sm");
  // Let's not bump text-base, since maybe we want some stability at top levels, but maybe we should:
  // content = content.replace(/\btext-base\b/g, "text-lg");

  // Increase line spacing. If text is denser, increase leading or replace tracking-normal
  content = content.replace(/\bleading-tight\b/g, "leading-snug");
  content = content.replace(/\btracking-tight\b/g, "tracking-normal");
  
  // Increase gap slightly for layout breathing room
  content = content.replace(/\bgap-1\b/g, "gap-1.5");
  content = content.replace(/\bgap-1\.5\b/g, "gap-1");
  content = content.replace(/\bgap-2\b/g, "gap-1.5");
  content = content.replace(/\bgap-3\b/g, "gap-3");
  
  // Increase standard padding slightly
  content = content.replace(/\bp-2\b/g, "p-2.5");
  content = content.replace(/\bp-3\b/g, "p-3");

  if (content !== original) {
    fs.writeFileSync(file, content, "utf8");
  }
});
