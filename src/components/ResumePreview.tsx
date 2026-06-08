import { ResumeData } from "@/lib/resume";
import { buildResumeHtml } from "@/lib/resumeHtml";

export function ResumePreview({ resume }: { resume: ResumeData }) {
  return <div className="preview-frame" dangerouslySetInnerHTML={{ __html: buildResumeHtml(resume) }} />;
}
